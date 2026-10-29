export type UserRole = 'customer' | 'staff' | 'admin' | 'super_admin';

export type OrderStatus =
  | 'pending_review'
  | 'awaiting_payment'
  | 'verifying_payment'
  | 'designing'
  | 'awaiting_confirmation'
  | 'revising'
  | 'preparing_files'
  | 'completed'
  | 'delivered'
  | 'cancelled';

export type DynamicFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'image_upload';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  contact_channel: string;
  avatar_url?: string | null;
  role?: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  granted_by?: string | null;
  created_at: string;
  profile?: Profile;
}

export interface CategoryGroup {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface SignCategory {
  id: string;
  group_id: string | null;
  group_name: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  preview_image_url: string;
  base_price: number;
  is_popular: boolean;
  is_recommended: boolean;
  requires_sensitive_review: boolean;
  sort_order: number;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface SignStyle {
  id: string;
  code: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  preview_image_url: string;
  price_modifier: number;
  sort_order: number;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface SignTemplate {
  id: string;
  code: string;
  name: string;
  sign_category_id: string;
  style_id: string;
  preview_image_url: string;
  description: string;
  sample_tags: string[];
  base_price_override: number | null;
  is_popular: boolean;
  is_featured_sample: boolean;
  status: 'published' | 'draft' | 'archived';
  sort_order: number;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface DecorationColor {
  id: string;
  slug: string;
  name: string;
  hex_code: string;
  preview_image_url?: string | null;
  sort_order: number;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface DecorationCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  parent_id: string | null;
  default_color_id: string | null;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface DecorationItem {
  id: string;
  code: string;
  name: string;
  color_id: string;
  category_id: string;
  image_url: string;
  price: 0; // Strictly 0 THB always
  is_free: true;
  sort_order: number;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface ProductField {
  id: string;
  sign_category_id: string;
  field_key: string;
  label: string;
  placeholder: string;
  field_type: DynamicFieldType;
  options: string[];
  is_required: boolean;
  help_text: string;
  is_sensitive: boolean;
  sort_order: number;
  is_active: boolean;
  is_demo: boolean;
  created_at?: string;
}

export interface Promotion {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
  usage_limit?: number | null;
  used_count: number;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface OrderItemFieldSnapshot {
  id?: string;
  order_item_id?: string;
  product_field_id?: string | null;
  snapshot_field_key: string;
  snapshot_field_label: string;
  snapshot_field_type: DynamicFieldType;
  field_value: string;
  file_storage_path?: string | null;
  is_sensitive: boolean;
}

export interface OrderItemDecorationSnapshot {
  id?: string;
  order_item_id?: string;
  decoration_id: string | null;
  snapshot_decoration_code: string;
  snapshot_decoration_name: string;
  snapshot_color_name: string;
  snapshot_category_name: string;
  snapshot_image_url: string;
  snapshot_price: 0;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  sign_category_id: string | null;
  style_id: string | null;
  template_id: string | null;
  snapshot_sign_type_name: string;
  snapshot_style_name: string;
  snapshot_template_code: string;
  snapshot_template_name: string;
  snapshot_template_image: string;
  snapshot_base_price: number;
  snapshot_style_price: number;
  snapshot_addon_price: number;
  snapshot_decorations_price: 0;
  item_total_price: number;
  quantity: number;
  item_note: string;
  fields: OrderItemFieldSnapshot[];
  decorations: OrderItemDecorationSnapshot[];
}

export interface OrderStatusHistoryRecord {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string;
  changed_by?: string | null;
  changed_by_name: string;
  created_at: string;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  user_id?: string | null;
  customer_name: string;
  customer_contact: string;
  customer_email: string;
  delivery_channel: string;
  customer_note: string;
  internal_note: string;
  contact_lookup_key: string;
  tracking_access_token: string;
  status: OrderStatus;
  subtotal_amount: number;
  discount_amount: number;
  service_fee: number;
  total_amount: number;
  promotion_code?: string | null;
  is_paid: boolean;
  paid_at?: string | null;
  idempotency_key?: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  items: OrderItemRecord[];
  history: OrderStatusHistoryRecord[];
}

export type TrackedOrderRecord = Pick<
  OrderRecord,
  | 'id'
  | 'order_number'
  | 'customer_name'
  | 'delivery_channel'
  | 'status'
  | 'subtotal_amount'
  | 'discount_amount'
  | 'service_fee'
  | 'total_amount'
  | 'promotion_code'
  | 'is_paid'
  | 'is_demo'
  | 'created_at'
  | 'updated_at'
  | 'items'
  | 'history'
>;

export interface ReviewRecord {
  id: string;
  order_id?: string | null;
  user_id?: string | null;
  customer_name: string;
  rating: number;
  sign_type_name: string;
  style_name: string;
  comment: string;
  review_image_url?: string | null;
  is_published: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  actor_id?: string | null;
  actor_email: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface BrandingSettings {
  shop_name: string;
  shop_tagline: string;
  logo_url: string;
  is_placeholder_data: boolean;
  theme_colors: {
    brand_pink: string;
    brand_pink_dark: string;
    brand_pink_light: string;
    brand_cream: string;
    brand_brown: string;
  };
}

export interface HeroBannerSettings {
  badge_text: string;
  headline: string;
  subheadline: string;
  cta_primary_text: string;
  cta_secondary_text: string;
  banner_image_url: string;
}

export interface HowToOrderStep {
  step: number;
  title: string;
  description: string;
}

export interface ShopHighlight {
  title: string;
  description: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ContactFooterSettings {
  line_id: string;
  facebook: string;
  instagram: string;
  email: string;
  phone: string;
  working_hours: string;
  footer_note: string;
  service_fee?: number;
}

export interface SiteSettingsBundle {
  branding: BrandingSettings;
  hero_banner: HeroBannerSettings;
  how_to_order: HowToOrderStep[];
  highlights: ShopHighlight[];
  faq_list: FaqItem[];
  contact_footer: ContactFooterSettings;
}

// Order Wizard Draft Item (Supports multi-sign order per PART 6 & PART 12)
export interface WizardSignDraftItem {
  draft_id: string;
  sign_category_id: string;
  style_id: string;
  template_id: string;
  decoration_ids: string[];
  field_values: Record<string, string>;
  field_files: Record<string, string>;
  quantity: number;
  item_note: string;
}

export interface OrderWizardState {
  current_step: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  active_item_index: number;
  items: WizardSignDraftItem[];
  promotion_code: string;
  customer_name: string;
  customer_contact: string;
  customer_email: string;
  delivery_channel: string;
  customer_note: string;
  sensitive_data_confirmed: boolean;
}
