-- ============================================================================
-- Custom Sign Studio - Migration 01: Core Schema, Tables, Constraints & Indexes
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. profiles
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  phone text not null default '',
  contact_channel text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. user_roles (Strict server-side role table; users cannot self-promote)
-- ----------------------------------------------------------------------------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'staff', 'admin', 'super_admin')),
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_user_roles_role on public.user_roles(role);

-- Helper trigger to auto-create profile and customer role on Auth sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, contact_channel)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'ลูกค้า'), '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'contact_channel', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2b. category_groups (High-level grouping for Sign Categories)
-- ----------------------------------------------------------------------------
create table if not exists public.category_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  icon_name text not null default 'Sparkles',
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. sign_categories (The 15+ Sign Types e.g., ป้ายร้านค้า, ป้ายบัญชีธนาคาร)
-- ----------------------------------------------------------------------------
create table if not exists public.sign_categories (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.category_groups(id) on delete set null,
  group_name text not null default 'ป้ายร้านค้ายอดนิยม',
  slug text not null unique,
  name text not null,
  short_description text not null default '',
  description text not null default '',
  preview_image_url text not null default '/placeholders/signs/sign-shop.svg',
  base_price numeric(10,2) not null default 59.00 check (base_price >= 0),
  is_popular boolean not null default false,
  is_recommended boolean not null default false,
  requires_sensitive_review boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sign_categories_active_sort on public.sign_categories(is_active, sort_order);
create index if not exists idx_sign_categories_group on public.sign_categories(group_id);

-- ----------------------------------------------------------------------------
-- 4. sign_styles (Minimal, Decorative, etc.)
-- ----------------------------------------------------------------------------
create table if not exists public.sign_styles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  features jsonb not null default '[]'::jsonb,
  preview_image_url text not null default '/placeholders/styles/minimal.svg',
  price_modifier numeric(10,2) not null default 0.00 check (price_modifier >= 0),
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sign_styles_active_sort on public.sign_styles(is_active, sort_order);

-- ----------------------------------------------------------------------------
-- 5. sign_templates (Ready-made template previews filtered by Sign Type & Style)
-- ----------------------------------------------------------------------------
create table if not exists public.sign_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  sign_category_id uuid not null references public.sign_categories(id) on delete cascade,
  style_id uuid not null references public.sign_styles(id) on delete restrict,
  preview_image_url text not null default '/placeholders/templates/MIN-001.svg',
  description text not null default '',
  sample_tags jsonb not null default '[]'::jsonb,
  base_price_override numeric(10,2) check (base_price_override is null or base_price_override >= 0),
  is_popular boolean not null default false,
  is_featured_sample boolean not null default false,
  status text not null default 'published' check (status in ('published', 'draft', 'archived')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sign_templates_cat_style on public.sign_templates(sign_category_id, style_id, is_active, status);
create index if not exists idx_sign_templates_popular on public.sign_templates(is_popular, is_active);

-- ----------------------------------------------------------------------------
-- 6. decoration_colors (Color palette categories for free decorations)
-- ----------------------------------------------------------------------------
create table if not exists public.decoration_colors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  hex_code text not null default '#F7B7C8',
  preview_image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_decoration_colors_sort on public.decoration_colors(is_active, sort_order);

-- ----------------------------------------------------------------------------
-- 7. decoration_categories (Hierarchical subcategories e.g. โบว์, ดอกไม้, หัวใจ)
--    Supports multi-level nesting via parent_id and optional primary color link
-- ----------------------------------------------------------------------------
create table if not exists public.decoration_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  parent_id uuid references public.decoration_categories(id) on delete set null,
  default_color_id uuid references public.decoration_colors(id) on delete set null,
  icon_name text not null default 'Sparkles',
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_decoration_categories_parent on public.decoration_categories(parent_id, is_active, sort_order);

-- ----------------------------------------------------------------------------
-- 8. decorations (Individual free decorative stickers/frames/icons — strictly 0 THB)
-- ----------------------------------------------------------------------------
create table if not exists public.decorations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  color_id uuid not null references public.decoration_colors(id) on delete restrict,
  category_id uuid not null references public.decoration_categories(id) on delete restrict,
  image_url text not null default '/placeholders/decorations/DEC-ITEM-01.svg',
  price numeric(10,2) not null default 0.00 check (price = 0.00),
  is_free boolean not null default true check (is_free = true),
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_decorations_color_cat on public.decorations(color_id, category_id, is_active);

-- ----------------------------------------------------------------------------
-- 9. product_fields (Dynamic form fields per sign category)
-- ----------------------------------------------------------------------------
create table if not exists public.product_fields (
  id uuid primary key default gen_random_uuid(),
  sign_category_id uuid not null references public.sign_categories(id) on delete cascade,
  field_key text not null,
  label text not null,
  placeholder text not null default '',
  field_type text not null check (field_type in ('text', 'textarea', 'number', 'select', 'checkbox', 'date', 'time', 'image_upload')),
  options jsonb not null default '[]'::jsonb,
  is_required boolean not null default true,
  help_text text not null default '',
  is_sensitive boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sign_category_id, field_key)
);

create index if not exists idx_product_fields_category on public.product_fields(sign_category_id, is_active, sort_order);

-- ----------------------------------------------------------------------------
-- 10. promotions
-- ----------------------------------------------------------------------------
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null default '',
  discount_type text not null default 'fixed' check (discount_type in ('fixed', 'percentage')),
  discount_value numeric(10,2) not null default 0.00 check (discount_value >= 0),
  min_order_amount numeric(10,2) not null default 0.00 check (min_order_amount >= 0),
  max_discount_amount numeric(10,2) check (max_discount_amount is null or max_discount_amount >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit int,
  used_count int not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 11. orders
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_contact text not null,
  customer_email text not null default '',
  delivery_channel text not null default 'LINE Official',
  customer_note text not null default '',
  internal_note text not null default '',
  -- Secure verification token / last-4 contact lookup for Guest Order Tracking
  contact_lookup_key text not null,
  tracking_access_token text not null default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'pending_review' check (
    status in (
      'pending_review',
      'awaiting_payment',
      'verifying_payment',
      'designing',
      'awaiting_confirmation',
      'revising',
      'preparing_files',
      'completed',
      'delivered',
      'cancelled'
    )
  ),
  subtotal_amount numeric(10,2) not null default 0.00 check (subtotal_amount >= 0),
  discount_amount numeric(10,2) not null default 0.00 check (discount_amount >= 0),
  service_fee numeric(10,2) not null default 0.00 check (service_fee >= 0),
  total_amount numeric(10,2) not null default 0.00 check (total_amount >= 0),
  promotion_code text,
  is_paid boolean not null default false,
  paid_at timestamptz,
  idempotency_key text unique,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user_id on public.orders(user_id, created_at desc);
create index if not exists idx_orders_order_number on public.orders(order_number);
create index if not exists idx_orders_status on public.orders(status, is_demo, created_at desc);

-- ----------------------------------------------------------------------------
-- 12. order_items (Stores immutable snapshots of prices, names, and codes)
-- ----------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sign_category_id uuid references public.sign_categories(id) on delete set null,
  style_id uuid references public.sign_styles(id) on delete set null,
  template_id uuid references public.sign_templates(id) on delete set null,
  snapshot_sign_type_name text not null,
  snapshot_style_name text not null,
  snapshot_template_code text not null,
  snapshot_template_name text not null,
  snapshot_template_image text not null default '',
  snapshot_base_price numeric(10,2) not null check (snapshot_base_price >= 0),
  snapshot_style_price numeric(10,2) not null check (snapshot_style_price >= 0),
  snapshot_addon_price numeric(10,2) not null default 0.00 check (snapshot_addon_price >= 0),
  snapshot_decorations_price numeric(10,2) not null default 0.00 check (snapshot_decorations_price = 0.00),
  item_total_price numeric(10,2) not null check (item_total_price >= 0),
  quantity int not null default 1 check (quantity >= 1),
  item_note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);

-- ----------------------------------------------------------------------------
-- 13. order_item_fields (Customer submitted dynamic form values per item)
-- ----------------------------------------------------------------------------
create table if not exists public.order_item_fields (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  product_field_id uuid references public.product_fields(id) on delete set null,
  snapshot_field_key text not null,
  snapshot_field_label text not null,
  snapshot_field_type text not null,
  field_value text not null default '',
  file_storage_path text,
  is_sensitive boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_item_fields_item_id on public.order_item_fields(order_item_id);

-- ----------------------------------------------------------------------------
-- 14. order_item_decorations (Snapshots of free decorations chosen per item)
-- ----------------------------------------------------------------------------
create table if not exists public.order_item_decorations (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  decoration_id uuid references public.decorations(id) on delete set null,
  snapshot_decoration_code text not null default '',
  snapshot_decoration_name text not null,
  snapshot_color_name text not null,
  snapshot_category_name text not null,
  snapshot_image_url text not null default '',
  snapshot_price numeric(10,2) not null default 0.00 check (snapshot_price = 0.00),
  created_at timestamptz not null default now()
);

create index if not exists idx_order_item_decorations_item_id on public.order_item_decorations(order_item_id);

-- ----------------------------------------------------------------------------
-- 15. order_status_history
-- ----------------------------------------------------------------------------
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text not null default '',
  changed_by uuid references public.profiles(id) on delete set null,
  changed_by_name text not null default 'ระบบอัตโนมัติ',
  created_at timestamptz not null default now()
);

create index if not exists idx_order_status_history_order on public.order_status_history(order_id, created_at asc);

-- ----------------------------------------------------------------------------
-- 16. favorites
-- ----------------------------------------------------------------------------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid not null references public.sign_templates(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, template_id)
);

create index if not exists idx_favorites_user on public.favorites(user_id);

-- ----------------------------------------------------------------------------
-- 17. reviews (Clearly separated is_demo flag so demo reviews are marked)
-- ----------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  rating int not null default 5 check (rating between 1 and 5),
  sign_type_name text not null default '',
  style_name text not null default '',
  comment text not null,
  review_image_url text,
  is_published boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_published on public.reviews(is_published, is_demo, created_at desc);

-- ----------------------------------------------------------------------------
-- 18. site_settings (Dynamic CMS for shop name, logo, colors, hero, FAQ, footer)
-- ----------------------------------------------------------------------------
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_group text not null default 'general',
  setting_value jsonb not null default '{}'::jsonb,
  description text not null default '',
  is_public boolean not null default true,
  is_demo boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 19. audit_logs (Activity logs for administrative actions)
-- ----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text not null default '',
  actor_role text not null default '',
  action text not null,
  entity_type text not null,
  entity_id text not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
