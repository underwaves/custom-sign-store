-- ============================================================================
-- Custom Sign Studio - Migration 03: Server-Side Transactional RPCs
-- 1. submit_custom_sign_order:
--    - Validates required customer info
--    - Validates active sign categories, styles, templates, and decorations
--    - Computes all prices on the server (decorations are strictly 0 THB)
--    - Applies valid promotion discount if provided
--    - Saves Order, Order Items, Fields, Decorations, Price Snapshots, Status History
--      atomically inside a single PostgreSQL transaction
--    - Enforces idempotency_key to prevent duplicate orders on double-click
-- 2. track_order_secure:
--    - Verifies BOTH order_number AND customer contact (or tracking token)
--    - Masks sensitive fields (like bank account numbers) on public tracking
-- ============================================================================

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
  v_base_price numeric(10,2);
  v_style_price numeric(10,2);
  v_item_total numeric(10,2);
  v_qty int;
  v_order_item_id uuid;
begin
  v_idempotency_key := nullif(trim(coalesce(p_payload->>'idempotency_key', '')), '');

  -- 1. Idempotency check (prevent duplicate orders from double-click)
  if v_idempotency_key is not null then
    select id, order_number, tracking_access_token, total_amount, status, created_at
      into v_existing_order
      from public.orders
     where idempotency_key = v_idempotency_key
     limit 1;

    if found then
      return jsonb_build_object(
        'order_id', v_existing_order.id,
        'order_number', v_existing_order.order_number,
        'tracking_token', v_existing_order.tracking_access_token,
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

  -- Normalize contact lookup key (lowercase alphanumeric last 4+ chars or full trimmed contact)
  v_contact_lookup := lower(regexp_replace(v_customer_contact, '\s+', '', 'g'));

  -- Generate unique Order Number: CSS-YYYYMMDD-XXXX
  v_order_number := 'CSS-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 5));
  v_tracking_token := encode(gen_random_bytes(16), 'hex');

  -- Insert shell order first inside transaction, then compute exact server-side totals from items
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

  -- 3. Loop through items, verify active status & calculate server-side prices
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
    -- Formula: ราคาต่อป้าย = ราคาฐานของประเภทป้าย + ราคาเพิ่มของสไตล์ + ตัวเลือกเสริม (ของตกแต่งฟรี 0 บาทเสมอ)
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

    -- Save dynamic form fields for this item
    if jsonb_typeof(v_item->'fields') = 'array' then
      for v_field in select * from jsonb_array_elements(v_item->'fields')
      loop
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
          nullif(v_field->>'product_field_id', '')::uuid,
          coalesce(v_field->>'field_key', 'field'),
          coalesce(v_field->>'label', 'ข้อมูล'),
          coalesce(v_field->>'field_type', 'text'),
          coalesce(v_field->>'value', ''),
          nullif(v_field->>'file_storage_path', ''),
          coalesce((v_field->>'is_sensitive')::boolean, false)
        );
      end loop;
    end if;

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

  -- 4. Apply Promotion Code if valid
  if v_promo_code <> '' then
    select * into v_promo
      from public.promotions
     where upper(code) = v_promo_code
       and is_active = true
       and (starts_at is null or starts_at <= now())
       and (expires_at is null or expires_at >= now())
       and (usage_limit is null or used_count < usage_limit)
       and v_subtotal >= min_order_amount
     limit 1;

    if found then
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
  end if;

  v_total := greatest(v_subtotal - v_discount + v_service_fee, 0.00);

  update public.orders
     set subtotal_amount = v_subtotal,
         discount_amount = v_discount,
         service_fee = v_service_fee,
         total_amount = v_total,
         updated_at = now()
   where id = v_order_id;

  -- 5. Initial Status History entry
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
    'total_amount', v_total,
    'status', 'pending_review',
    'created_at', now(),
    'idempotent_replay', false
  );
end;
$$;

-- Secure Order Tracking RPC: requires BOTH order_number AND matching contact (or tracking_access_token)
create or replace function public.track_order_secure(
  p_order_number text,
  p_verification text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_order record;
  v_norm_verify text;
  v_items jsonb;
  v_history jsonb;
begin
  v_norm_verify := lower(regexp_replace(trim(coalesce(p_verification, '')), '\s+', '', 'g'));

  if length(trim(coalesce(p_order_number, ''))) < 5 or length(v_norm_verify) < 4 then
    raise exception 'กรุณากรอกหมายเลขออเดอร์และข้อมูลยืนยันตัวตนให้ครบถ้วน';
  end if;

  select * into v_order
    from public.orders
   where upper(order_number) = upper(trim(p_order_number))
     and (
       contact_lookup_key = v_norm_verify
       or right(contact_lookup_key, 4) = right(v_norm_verify, 4)
       or lower(tracking_access_token) = v_norm_verify
       or (auth.uid() is not null and user_id = auth.uid())
     )
   limit 1;

  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', oi.id,
      'snapshot_sign_type_name', oi.snapshot_sign_type_name,
      'snapshot_style_name', oi.snapshot_style_name,
      'snapshot_template_code', oi.snapshot_template_code,
      'snapshot_template_name', oi.snapshot_template_name,
      'snapshot_template_image', oi.snapshot_template_image,
      'snapshot_base_price', oi.snapshot_base_price,
      'snapshot_style_price', oi.snapshot_style_price,
      'snapshot_decorations_price', oi.snapshot_decorations_price,
      'item_total_price', oi.item_total_price,
      'quantity', oi.quantity,
      'item_note', oi.item_note,
      'decorations', (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'name', oid.snapshot_decoration_name,
            'color_name', oid.snapshot_color_name,
            'category_name', oid.snapshot_category_name,
            'image_url', oid.snapshot_image_url,
            'price', oid.snapshot_price
          )
        ), '[]'::jsonb)
        from public.order_item_decorations oid
        where oid.order_item_id = oi.id
      ),
      'fields', (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'label', oif.snapshot_field_label,
            'field_type', oif.snapshot_field_type,
            -- Mask sensitive bank account digits if viewed via guest tracking
            'value', case
              when oif.is_sensitive and length(oif.field_value) > 4
                then repeat('*', greatest(length(oif.field_value) - 4, 2)) || right(oif.field_value, 4)
              else oif.field_value
            end
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

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', osh.id,
      'status', osh.status,
      'note', osh.note,
      'changed_by_name', osh.changed_by_name,
      'created_at', osh.created_at
    ) order by osh.created_at asc
  ), '[]'::jsonb)
  into v_history
  from public.order_status_history osh
  where osh.order_id = v_order.id;

  return jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'customer_name', v_order.customer_name,
    'delivery_channel', v_order.delivery_channel,
    'customer_note', v_order.customer_note,
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
