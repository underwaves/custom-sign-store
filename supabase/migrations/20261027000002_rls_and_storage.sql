-- ============================================================================
-- Custom Sign Studio - Migration 02: Row Level Security (RLS) & Storage Policies
-- ============================================================================

-- Helper function: Check if current user is admin/staff on the server side
create or replace function public.is_admin_or_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('staff', 'admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('admin', 'super_admin')
  );
$$;

-- Enable RLS on all 20 tables
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.category_groups enable row level security;
alter table public.sign_categories enable row level security;
alter table public.sign_styles enable row level security;
alter table public.sign_templates enable row level security;
alter table public.decoration_colors enable row level security;
alter table public.decoration_categories enable row level security;
alter table public.decorations enable row level security;
alter table public.product_fields enable row level security;
alter table public.promotions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_fields enable row level security;
alter table public.order_item_decorations enable row level security;
alter table public.order_status_history enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;

-- 1. profiles policies
create policy "Users can view own profile or admins view all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin_or_staff());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. user_roles policies (Customers CANNOT insert or update roles)
create policy "Users can read own role or admins read all"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_admin_or_staff());

create policy "Only super_admin/admin can manage user_roles"
  on public.user_roles for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- 3. Public catalog tables: Public reads active items; Admins manage all
create policy "Public read active category_groups"
  on public.category_groups for select
  using (is_active = true or public.is_admin_or_staff());

create policy "Admin manage category_groups"
  on public.category_groups for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

create policy "Public read active sign_categories"
  on public.sign_categories for select
  using (is_active = true or public.is_admin_or_staff());

create policy "Admin manage sign_categories"
  on public.sign_categories for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

create policy "Public read active sign_styles"
  on public.sign_styles for select
  using (is_active = true or public.is_admin_or_staff());

create policy "Admin manage sign_styles"
  on public.sign_styles for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

create policy "Public read published sign_templates"
  on public.sign_templates for select
  using ((is_active = true and status = 'published') or public.is_admin_or_staff());

create policy "Admin manage sign_templates"
  on public.sign_templates for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

create policy "Public read active decoration_colors"
  on public.decoration_colors for select
  using (is_active = true or public.is_admin_or_staff());

create policy "Admin manage decoration_colors"
  on public.decoration_colors for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

create policy "Public read active decoration_categories"
  on public.decoration_categories for select
  using (is_active = true or public.is_admin_or_staff());

create policy "Admin manage decoration_categories"
  on public.decoration_categories for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

create policy "Public read active decorations"
  on public.decorations for select
  using (is_active = true or public.is_admin_or_staff());

create policy "Admin manage decorations"
  on public.decorations for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

create policy "Public read active product_fields"
  on public.product_fields for select
  using (is_active = true or public.is_admin_or_staff());

create policy "Admin manage product_fields"
  on public.product_fields for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

create policy "Public read active promotions"
  on public.promotions for select
  using (is_active = true or public.is_admin_or_staff());

create policy "Admin manage promotions"
  on public.promotions for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- 4. Orders & Order Details Policies
-- Authenticated customers can view ONLY their own orders.
-- Direct INSERT into orders from client is blocked for price safety; orders are created via secure RPC `submit_custom_sign_order`.
-- Admins can read and update all orders.
create policy "Customers view own orders or admins view all"
  on public.orders for select
  using ((auth.uid() is not null and auth.uid() = user_id) or public.is_admin_or_staff());

create policy "Admins manage orders"
  on public.orders for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

create policy "Customers view own order_items or admins view all"
  on public.order_items for select
  using (
    public.is_admin_or_staff()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
        and auth.uid() is not null
    )
  );

create policy "Admins manage order_items"
  on public.order_items for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

create policy "Customers view own order_item_fields or admins view all"
  on public.order_item_fields for select
  using (
    public.is_admin_or_staff()
    or exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_fields.order_item_id
        and o.user_id = auth.uid()
        and auth.uid() is not null
    )
  );

create policy "Admins manage order_item_fields"
  on public.order_item_fields for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

create policy "Customers view own order_item_decorations or admins view all"
  on public.order_item_decorations for select
  using (
    public.is_admin_or_staff()
    or exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_decorations.order_item_id
        and o.user_id = auth.uid()
        and auth.uid() is not null
    )
  );

create policy "Admins manage order_item_decorations"
  on public.order_item_decorations for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

create policy "Customers view own order_status_history or admins view all"
  on public.order_status_history for select
  using (
    public.is_admin_or_staff()
    or exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and o.user_id = auth.uid()
        and auth.uid() is not null
    )
  );

create policy "Admins manage order_status_history"
  on public.order_status_history for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- 5. Favorites Policies
create policy "Users manage own favorites"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. Reviews Policies
create policy "Public read published reviews"
  on public.reviews for select
  using (is_published = true or public.is_admin_or_staff());

create policy "Authenticated users can submit review"
  on public.reviews for insert
  with check (auth.uid() = user_id and is_demo = false);

create policy "Admins manage reviews"
  on public.reviews for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- 7. Site Settings Policies
create policy "Public read public site_settings"
  on public.site_settings for select
  using (is_public = true or public.is_admin_or_staff());

create policy "Admins manage site_settings"
  on public.site_settings for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- 8. Audit Logs Policies
create policy "Admins read audit_logs"
  on public.audit_logs for select
  using (public.is_admin_or_staff());

create policy "Admins insert audit_logs"
  on public.audit_logs for insert
  with check (public.is_admin_or_staff());

-- ============================================================================
-- Part 18: Supabase Storage Buckets & Policies
-- Buckets:
--   1. site-assets (Public)
--   2. sign-templates (Public)
--   3. decorations (Public)
--   4. customer-references (Private — never public by default!)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('site-assets', 'site-assets', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('sign-templates', 'sign-templates', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('decorations', 'decorations', true, 3145728, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('customer-references', 'customer-references', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read for site-assets, sign-templates, decorations
create policy "Public read public buckets"
  on storage.objects for select
  using (bucket_id in ('site-assets', 'sign-templates', 'decorations'));

-- Only admins/staff can upload, update, or delete in public catalog buckets
create policy "Admins upload to public buckets"
  on storage.objects for insert
  with check (
    bucket_id in ('site-assets', 'sign-templates', 'decorations')
    and public.is_admin_or_staff()
  );

create policy "Admins update public buckets"
  on storage.objects for update
  using (
    bucket_id in ('site-assets', 'sign-templates', 'decorations')
    and public.is_admin_or_staff()
  );

create policy "Admins delete from public buckets"
  on storage.objects for delete
  using (
    bucket_id in ('site-assets', 'sign-templates', 'decorations')
    and public.is_admin_or_staff()
  );

-- Private bucket: customer-references
-- Customers (or guest upload path scoped to order folder) can upload images; only owner or admin can view
create policy "Anyone placing order can upload customer reference image"
  on storage.objects for insert
  with check (bucket_id = 'customer-references');

create policy "Only admins or owner can read customer-references"
  on storage.objects for select
  using (
    bucket_id = 'customer-references'
    and (public.is_admin_or_staff() or (auth.uid() is not null and owner = auth.uid()))
  );

create policy "Only admins can delete customer-references"
  on storage.objects for delete
  using (bucket_id = 'customer-references' and public.is_admin_or_staff());
