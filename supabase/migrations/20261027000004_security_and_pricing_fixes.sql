-- ============================================================================
-- Custom Sign Studio - Migration 04: Security & Pricing Fixes
-- 1. Anti-Brute-Force & Access Control for Order Tracking:
--    - Table `order_tracking_rate_limits` to rate-limit tracking lookups
--    - Helper functions `record_tracking_failure` and `clear_tracking_failure`
--    - Update `track_order_secure`:
--        * Completely removes 4-digit / contact phone number verification
--        * Requires random tracking_access_token for guests
--        * Authorizes logged-in order owner or admin/staff
--        * Rate-limits brute force attempts per client without locking a target order globally
--        * Returns only minimal necessary data and masks sensitive fields
-- 2. Server-side Authoritative Pricing & Service Fee:
--    - In `submit_custom_sign_order`, fetch authoritative service_fee from
--      `public.site_settings` ('contact_footer' -> 'service_fee')
--    - Compute total_amount = subtotal - discount + service_fee server-side
--    - Return service_fee and trusted amounts in RPC response
-- 3. Strict Dynamic Form Field Validation:
--    - Validate each submitted item field against active `product_fields`
--      belonging to the chosen sign category
--    - Reject fake or deactivated fields
--    - Enforce required fields (including image_upload checks)
--    - Read field_key, label, field_type, and is_sensitive directly from DB
-- 4. Atomic Promotion Code Quota Protection:
--    - Lock promotion row `FOR UPDATE` before checking quota and conditions
--    - Ensure atomic increment of used_count under concurrency
--    - Maintain start/expiration dates, min order amount, and discount ceilings
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Rate limiting table for order tracking lookups
-- ----------------------------------------------------------------------------
create table if not exists public.order_tracking_rate_limits (
  id uuid primary key default gen_random_uuid(),
  client_identifier text not null,
  target_order_number text not null,
  failed_attempts int not null default 1,
  first_attempt_at timestamptz not null default now(),
  last_attempt_at timestamptz not null default now(),
  blocked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_order_tracking_rate_limits_client_order
    unique (client_identifier, target_order_number)
);

alter table public.order_tracking_rate_limits enable row level security;

create policy "Admins manage tracking rate limits"
  on public.order_tracking_rate_limits for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- Helper: Record failed tracking lookup
create or replace function public.record_tracking_failure(
  p_client_id text,
  p_order_number text,
  p_max_attempts int default 5,
  p_block_minutes int default 15
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.order_tracking_rate_limits as existing (
    client_identifier,
    target_order_number,
    failed_attempts,
    first_attempt_at,
    last_attempt_at
  ) values (
    p_client_id,
    p_order_number,
    1,
    now(),
    now()
  )
  on conflict (client_identifier, target_order_number) do update
     set failed_attempts = case
           when existing.last_attempt_at < now() - make_interval(mins => p_block_minutes) then 1
           else existing.failed_attempts + 1
         end,
         first_attempt_at = case
           when existing.last_attempt_at < now() - make_interval(mins => p_block_minutes) then now()
           else existing.first_attempt_at
         end,
         last_attempt_at = now(),
         blocked_until = case
           when existing.last_attempt_at < now() - make_interval(mins => p_block_minutes) then null
           when existing.failed_attempts + 1 >= p_max_attempts then now() + make_interval(mins => p_block_minutes)
           else existing.blocked_until
         end,
         updated_at = now();
end;
$$;

-- Helper: Clear failed tracking attempts upon successful lookup
create or replace function public.clear_tracking_failure(
  p_client_id text,
  p_order_number text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.order_tracking_rate_limits
   where client_identifier = p_client_id
     and target_order_number = p_order_number;
end;
$$;

-- Helpers are only invoked from the tracking RPC; don't expose them as public RPCs.
revoke all on function public.record_tracking_failure(text, text, int, int) from public;
revoke all on function public.clear_tracking_failure(text, text) from public;

-- ----------------------------------------------------------------------------
-- 2. Drop legacy track_order_secure and recreate secure version
-- ----------------------------------------------------------------------------
drop function if exists public.track_order_secure(text, text);

create or replace function public.track_order_secure(
  p_order_number text,
  p_tracking_token text default null,
  p_verification text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean_order text;
  v_clean_token text;
  v_client_ip text;
  v_rate_limit record;
  v_order record;
  v_is_authorized boolean := false;
  v_items jsonb;
  v_history jsonb;
  v_max_attempts constant int := 5;
  v_block_minutes constant int := 15;
begin
  v_clean_order := upper(trim(coalesce(p_order_number, '')));
  v_clean_token := lower(trim(coalesce(nullif(p_tracking_token, ''), p_verification, '')));

  delete from public.order_tracking_rate_limits
   where last_attempt_at < now() - interval '30 days';

  if length(v_clean_order) < 5 then
    raise exception 'กรุณาระบุหมายเลขออเดอร์ให้ถูกต้อง';
  end if;

  -- Extract client IP from headers if available
  begin
    v_client_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
    if v_client_ip is null or v_client_ip = '' then
      v_client_ip := current_setting('request.headers', true)::json->>'cf-connecting-ip';
    end if;
  exception when others then
    v_client_ip := null;
  end;
  v_client_ip := coalesce(split_part(v_client_ip, ',', 1), auth.uid()::text, 'unknown-client');

  -- Check if blocked by rate limit
  select * into v_rate_limit
    from public.order_tracking_rate_limits
   where target_order_number = '*'
     and client_identifier = v_client_ip
     and blocked_until > now()
   order by blocked_until desc
   limit 1;

  if found then
    raise exception 'ระบบจำกัดการค้นหาชั่วคราวเนื่องจากมีการลองค้นหาซ้ำเกินกำหนด กรุณารอสักครู่ (ประมาณ % นาที)',
      ceil(extract(epoch from (v_rate_limit.blocked_until - now())) / 60.0);
  end if;

  -- Find order by order_number
  select * into v_order
    from public.orders
   where upper(order_number) = v_clean_order
   limit 1;

  if not found then
    perform public.record_tracking_failure(v_client_ip, '*', v_max_attempts, v_block_minutes);
    return null;
  end if;

  -- Authorization check:
  -- 1) Order owner (authenticated user)
  if auth.uid() is not null and v_order.user_id = auth.uid() then
    v_is_authorized := true;
  -- 2) Admin or staff member
  elsif public.is_admin_or_staff() then
    v_is_authorized := true;
  -- 3) Guest with matching cryptographically random tracking_access_token
  elsif v_clean_token <> '' and lower(v_order.tracking_access_token) = v_clean_token then
    v_is_authorized := true;
  end if;

  if not v_is_authorized then
    perform public.record_tracking_failure(v_client_ip, '*', v_max_attempts, v_block_minutes);
    return null;
  end if;

  -- On successful verification, clear failed attempt counters
  perform public.clear_tracking_failure(v_client_ip, '*');

  -- Retrieve items with masked sensitive fields
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', oi.id,
      'order_id', oi.order_id,
      'sign_category_id', oi.sign_category_id,
      'style_id', oi.style_id,
      'template_id', oi.template_id,
      'snapshot_sign_type_name', oi.snapshot_sign_type_name,
      'snapshot_style_name', oi.snapshot_style_name,
      'snapshot_template_code', oi.snapshot_template_code,
      'snapshot_template_name', oi.snapshot_template_name,
      'snapshot_template_image', oi.snapshot_template_image,
      'snapshot_base_price', oi.snapshot_base_price,
      'snapshot_style_price', oi.snapshot_style_price,
      'snapshot_addon_price', oi.snapshot_addon_price,
      'snapshot_decorations_price', oi.snapshot_decorations_price,
      'item_total_price', oi.item_total_price,
      'quantity', oi.quantity,
      'item_note', oi.item_note,
      'decorations', (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'id', oid.id,
            'order_item_id', oid.order_item_id,
            'decoration_id', oid.decoration_id,
            'snapshot_decoration_code', oid.snapshot_decoration_code,
            'snapshot_decoration_name', oid.snapshot_decoration_name,
            'snapshot_color_name', oid.snapshot_color_name,
            'snapshot_category_name', oid.snapshot_category_name,
            'snapshot_image_url', oid.snapshot_image_url,
            'snapshot_price', oid.snapshot_price
          )
        ), '[]'::jsonb)
        from public.order_item_decorations oid
        where oid.order_item_id = oi.id
      ),
      'fields', (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'id', oif.id,
            'order_item_id', oif.order_item_id,
            'product_field_id', oif.product_field_id,
            'snapshot_field_key', oif.snapshot_field_key,
            'snapshot_field_label', oif.snapshot_field_label,
            'snapshot_field_type', oif.snapshot_field_type,
            'field_value', case
              when oif.is_sensitive then repeat('*', greatest(length(oif.field_value), 4))
              else oif.field_value
            end,
            'is_sensitive', oif.is_sensitive
          )
        ), '[]'::jsonb)
        from public.order_item_fields oif
        where oif.order_item_id = oi.id
      )
    )
  ), '[]'::jsonb)
  into v_items
  from public.order_items oi
  where oi.order_id = v_order.id;

  -- Retrieve status history
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', osh.id,
      'order_id', osh.order_id,
      'status', osh.status,
      'note', osh.note,
      'changed_by_name', osh.changed_by_name,
      'created_at', osh.created_at
    ) order by osh.created_at asc
  ), '[]'::jsonb)
  into v_history
  from public.order_status_history osh
  where osh.order_id = v_order.id;

  -- Keep contact credentials, token, and internal notes out of the public tracking response.
  return jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'customer_name', v_order.customer_name,
    'delivery_channel', v_order.delivery_channel,
    'status', v_order.status,
    'subtotal_amount', v_order.subtotal_amount,
    'discount_amount', v_order.discount_amount,
    'service_fee', v_order.service_fee,
    'total_amount', v_order.total_amount,
    'promotion_code', v_order.promotion_code,
    'is_paid', v_order.is_paid,
    'is_demo', v_order.is_demo,
    'created_at', v_order.created_at,
    'updated_at', v_order.updated_at,
    'items', v_items,
    'history', v_history
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Update submit_custom_sign_order:
--    - Server-side authoritative service_fee from public.site_settings
--    - Strict server-side validation against public.product_fields
--    - Atomic row-locked promotion quota & discount calculation
-- ----------------------------------------------------------------------------
create or replace function public.submit_custom_sign_order(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_idempotency_key text;
  v_existing_order record;
  v_customer_name text;
  v_customer_contact text;
  v_customer_email text;
  v_delivery_channel text;
  v_customer_note text;
  v_promo_code text;
  v_contact_lookup text;
  v_order_id uuid;
  v_order_number text;
  v_tracking_token text;
  v_subtotal numeric(10,2) := 0.00;
  v_discount numeric(10,2) := 0.00;
  v_service_fee numeric(10,2) := 0.00;
  v_total numeric(10,2) := 0.00;
  v_item jsonb;
  v_field jsonb;
  v_dec_id text;
  v_cat record;
  v_style record;
  v_tpl record;
  v_dec record;
  v_promo record;
  r_pf record;
  v_base_price numeric(10,2);
  v_style_price numeric(10,2);
  v_item_total numeric(10,2);
  v_qty int;
  v_order_item_id uuid;
  v_matched_field jsonb;
  v_field_val text;
  v_field_file text;
  v_found_field boolean;
begin
  v_idempotency_key := nullif(trim(coalesce(p_payload->>'idempotency_key', '')), '');

  -- 1. Idempotency check (prevent duplicate orders from double-click)
  if v_idempotency_key is not null then
    select id, order_number, tracking_access_token, subtotal_amount, discount_amount, service_fee, total_amount, status, created_at
      into v_existing_order
      from public.orders
     where idempotency_key = v_idempotency_key
       and user_id is not distinct from auth.uid()
       and contact_lookup_key = lower(regexp_replace(
         trim(coalesce(p_payload->>'customer_contact', '')), '\s+', '', 'g'
       ))
     limit 1;

    if found then
      return jsonb_build_object(
        'order_id', v_existing_order.id,
        'order_number', v_existing_order.order_number,
        'tracking_token', v_existing_order.tracking_access_token,
        'subtotal_amount', v_existing_order.subtotal_amount,
        'discount_amount', v_existing_order.discount_amount,
        'service_fee', v_existing_order.service_fee,
        'total_amount', v_existing_order.total_amount,
        'status', v_existing_order.status,
        'created_at', v_existing_order.created_at,
        'idempotent_replay', true
      );
    end if;
  end if;

  -- 2. Validate Customer Info
  v_customer_name := trim(coalesce(p_payload->>'customer_name', ''));
  v_customer_contact := trim(coalesce(p_payload->>'customer_contact', ''));
  v_customer_email := trim(coalesce(p_payload->>'customer_email', ''));
  v_delivery_channel := trim(coalesce(p_payload->>'delivery_channel', 'LINE Official'));
  v_customer_note := trim(coalesce(p_payload->>'customer_note', ''));
  v_promo_code := upper(trim(coalesce(p_payload->>'promotion_code', '')));

  if length(v_customer_name) < 2 then
    raise exception 'กรุณาระบุชื่อผู้สั่งซื้ออย่างน้อย 2 ตัวอักษร';
  end if;

  if length(v_customer_contact) < 4 then
    raise exception 'กรุณาระบุเบอร์โทรศัพท์หรือช่องทางติดต่อที่ถูกต้อง';
  end if;

  if jsonb_typeof(p_payload->'items') <> 'array' or jsonb_array_length(p_payload->'items') = 0 then
    raise exception 'กรุณาเลือกรายการป้ายอย่างน้อย 1 รายการ';
  end if;

  -- Normalize contact lookup key
  v_contact_lookup := lower(regexp_replace(v_customer_contact, '\s+', '', 'g'));

  -- Generate unique Order Number & cryptographically random Tracking Token
  v_order_number := 'CSS-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 5));
  v_tracking_token := encode(gen_random_bytes(16), 'hex');

  -- Insert shell order first inside transaction
  insert into public.orders (
    order_number,
    user_id,
    customer_name,
    customer_contact,
    customer_email,
    delivery_channel,
    customer_note,
    contact_lookup_key,
    tracking_access_token,
    status,
    promotion_code,
    idempotency_key,
    is_demo
  ) values (
    v_order_number,
    auth.uid(),
    v_customer_name,
    v_customer_contact,
    v_customer_email,
    v_delivery_channel,
    v_customer_note,
    v_contact_lookup,
    v_tracking_token,
    'pending_review',
    nullif(v_promo_code, ''),
    v_idempotency_key,
    false
  )
  returning id into v_order_id;

  -- 3. Loop through items, verify active catalog records & calculate server-side prices
  for v_item in select * from jsonb_array_elements(p_payload->'items')
  loop
    select * into v_cat
      from public.sign_categories
     where id = (v_item->>'sign_category_id')::uuid
       and is_active = true;
    if not found then
      raise exception 'ประเภทป้ายที่เลือกไม่พร้อมใช้งานในขณะนี้';
    end if;

    select * into v_style
      from public.sign_styles
     where id = (v_item->>'style_id')::uuid
       and is_active = true;
    if not found then
      raise exception 'สไตล์ป้ายที่เลือกไม่พร้อมใช้งานในขณะนี้';
    end if;

    select * into v_tpl
      from public.sign_templates
     where id = (v_item->>'template_id')::uuid
       and is_active = true
       and status = 'published';
    if not found then
      raise exception 'เทมเพลตที่เลือกปิดใช้งานแล้ว กรุณาเลือกเทมเพลตอื่น';
    end if;

    if v_tpl.style_id <> v_style.id then
      raise exception 'เทมเพลต % ไม่ตรงกับสไตล์ที่เลือก', v_tpl.code;
    end if;

    v_qty := greatest(coalesce((v_item->>'quantity')::int, 1), 1);
    v_base_price := coalesce(v_tpl.base_price_override, v_cat.base_price);
    v_style_price := v_style.price_modifier;
    v_item_total := (v_base_price + v_style_price) * v_qty;
    v_subtotal := v_subtotal + v_item_total;

    insert into public.order_items (
      order_id,
      sign_category_id,
      style_id,
      template_id,
      snapshot_sign_type_name,
      snapshot_style_name,
      snapshot_template_code,
      snapshot_template_name,
      snapshot_template_image,
      snapshot_base_price,
      snapshot_style_price,
      snapshot_addon_price,
      snapshot_decorations_price,
      item_total_price,
      quantity,
      item_note
    ) values (
      v_order_id,
      v_cat.id,
      v_style.id,
      v_tpl.id,
      v_cat.name,
      v_style.name,
      v_tpl.code,
      v_tpl.name,
      v_tpl.preview_image_url,
      v_base_price,
      v_style_price,
      0.00,
      0.00,
      v_item_total,
      v_qty,
      coalesce(v_item->>'item_note', '')
    )
    returning id into v_order_item_id;

    -- Strict server-side dynamic form field validation.
    if jsonb_typeof(v_item->'fields') is distinct from 'array' then
      raise exception 'ข้อมูลฟอร์มไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่กรอก';
    end if;

    -- Reject fake, unknown, deactivated, and duplicate fields submitted by the client.
    for v_field in select * from jsonb_array_elements(v_item->'fields')
    loop
      select exists (
        select 1
          from public.product_fields
         where sign_category_id = v_cat.id
           and is_active = true
           and id = nullif(v_field->>'product_field_id', '')::uuid
      ) into v_found_field;

      if not v_found_field then
        raise exception 'พบฟิลด์ที่ไม่ถูกต้องหรือถูกปิดใช้งานในประเภทป้าย "%"', v_cat.name;
      end if;
    end loop;

    if exists (
      select v_field_row->>'product_field_id'
        from jsonb_array_elements(v_item->'fields') as submitted(v_field_row)
       group by v_field_row->>'product_field_id'
      having count(*) > 1
    ) then
      raise exception 'พบช่องกรอกข้อมูลซ้ำ กรุณาตรวจสอบรายการอีกครั้ง';
    end if;

    -- Step B: Iterate through all active product_fields from DB for this category
    -- Read metadata directly from database and enforce required fields
    for r_pf in
      select *
        from public.product_fields
       where sign_category_id = v_cat.id
         and is_active = true
       order by sort_order asc
    loop
      v_matched_field := null;
      if jsonb_typeof(v_item->'fields') = 'array' then
        select submitted.field into v_matched_field
          from jsonb_array_elements(v_item->'fields') as submitted(field)
          where nullif(submitted.field->>'product_field_id', '')::uuid = r_pf.id
         limit 1;
      end if;

      v_field_val := coalesce(v_matched_field->>'value', '');
      v_field_file := nullif(trim(coalesce(v_matched_field->>'file_storage_path', '')), '');

      -- Enforce required fields
      if r_pf.is_required then
        if r_pf.field_type = 'image_upload' then
          if v_field_file is null and nullif(trim(v_field_val), '') is null then
            raise exception 'กรุณาอัปโหลดรูปภาพหรือระบุข้อมูลสำหรับฟิลด์ "%" ในประเภทป้าย "%"',
              r_pf.label, v_cat.name;
          end if;
        else
          if nullif(trim(v_field_val), '') is null then
            raise exception 'กรุณากรอกข้อมูลสำหรับฟิลด์ "%" ในประเภทป้าย "%"',
              r_pf.label, v_cat.name;
          end if;
        end if;
      end if;

      -- Save snapshot reading is_sensitive, field_type, label, and key strictly from DB
      insert into public.order_item_fields (
        order_item_id,
        product_field_id,
        snapshot_field_key,
        snapshot_field_label,
        snapshot_field_type,
        field_value,
        file_storage_path,
        is_sensitive
      ) values (
        v_order_item_id,
        r_pf.id,
        r_pf.field_key,
        r_pf.label,
        r_pf.field_type,
        v_field_val,
        v_field_file,
        r_pf.is_sensitive
      );
    end loop;

    -- Validate and save free decorations for this item (0 THB always)
    if jsonb_typeof(v_item->'decoration_ids') = 'array' then
      for v_dec_id in select jsonb_array_elements_text(v_item->'decoration_ids')
      loop
        select d.*, c.name as color_name, cat.name as category_name
          into v_dec
          from public.decorations d
          join public.decoration_colors c on c.id = d.color_id
          join public.decoration_categories cat on cat.id = d.category_id
         where d.id = v_dec_id::uuid
           and d.is_active = true;

        if not found then
          raise exception 'ของตกแต่งบางรายการถูกปิดใช้งานแล้ว กรุณาตรวจสอบรายการของตกแต่งอีกครั้ง';
        end if;

        insert into public.order_item_decorations (
          order_item_id,
          decoration_id,
          snapshot_decoration_code,
          snapshot_decoration_name,
          snapshot_color_name,
          snapshot_category_name,
          snapshot_image_url,
          snapshot_price
        ) values (
          v_order_item_id,
          v_dec.id,
          v_dec.code,
          v_dec.name,
          v_dec.color_name,
          v_dec.category_name,
          v_dec.image_url,
          0.00
        );
      end loop;
    end if;
  end loop;

  -- 4. Apply Promotion Code if valid with strict concurrency protection (FOR UPDATE)
  if v_promo_code <> '' then
    select * into v_promo
      from public.promotions
     where upper(code) = v_promo_code
       for update;

    if not found or v_promo.is_active = false then
      raise exception 'ไม่พบรหัสส่วนลด % หรือโปรโมชั่นนี้ถูกปิดใช้งานแล้ว', v_promo_code;
    end if;

    if v_promo.starts_at is not null and v_promo.starts_at > now() then
      raise exception 'รหัสส่วนลด % ยังไม่เริ่มเปิดใช้งาน', v_promo.code;
    end if;

    if v_promo.expires_at is not null and v_promo.expires_at < now() then
      raise exception 'รหัสส่วนลด % หมดอายุการใช้งานแล้ว', v_promo.code;
    end if;

    if v_promo.usage_limit is not null and v_promo.used_count >= v_promo.usage_limit then
      raise exception 'รหัสส่วนลด % มีผู้ใช้งานครบตามจำนวนสิทธิ์แล้ว', v_promo.code;
    end if;

    if v_subtotal < v_promo.min_order_amount then
      raise exception 'รหัสส่วนลด % ใช้ได้เมื่อมียอดสั่งซื้อขั้นต่ำ % บาทขึ้นไป', v_promo.code, v_promo.min_order_amount;
    end if;

    if v_promo.discount_type = 'percentage' then
      v_discount := round((v_subtotal * v_promo.discount_value) / 100.0, 2);
      if v_promo.max_discount_amount is not null then
        v_discount := least(v_discount, v_promo.max_discount_amount);
      end if;
    else
      v_discount := v_promo.discount_value;
    end if;
    v_discount := least(v_discount, v_subtotal);

    update public.promotions
       set used_count = used_count + 1,
           updated_at = now()
     where id = v_promo.id;
  end if;

  -- 5. Fetch authoritative service_fee from site_settings (Do NOT trust client-submitted amount)
  select coalesce(nullif(setting_value->>'service_fee', '')::numeric, 0.00)
    into v_service_fee
    from public.site_settings
   where setting_key = 'contact_footer'
   limit 1;

  v_service_fee := greatest(coalesce(v_service_fee, 0.00), 0.00);
  v_total := greatest(v_subtotal - v_discount + v_service_fee, 0.00);

  update public.orders
     set subtotal_amount = v_subtotal,
         discount_amount = v_discount,
         service_fee = v_service_fee,
         total_amount = v_total,
         updated_at = now()
   where id = v_order_id;

  -- 6. Initial Status History entry
  insert into public.order_status_history (
    order_id,
    status,
    note,
    changed_by,
    changed_by_name
  ) values (
    v_order_id,
    'pending_review',
    'ลูกค้าส่งคำสั่งซื้อสำเร็จ รอร้านค้าตรวจสอบรายละเอียด',
    auth.uid(),
    v_customer_name
  );

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'tracking_token', v_tracking_token,
    'subtotal_amount', v_subtotal,
    'discount_amount', v_discount,
    'service_fee', v_service_fee,
    'total_amount', v_total,
    'status', 'pending_review',
    'created_at', now(),
    'idempotent_replay', false
  );
end;
$$;

-- Expose only the intended order RPCs to browser roles.
revoke all on function public.track_order_secure(text, text, text) from public;
grant execute on function public.track_order_secure(text, text, text) to anon, authenticated;
revoke all on function public.submit_custom_sign_order(jsonb) from public;
grant execute on function public.submit_custom_sign_order(jsonb) to anon, authenticated;
