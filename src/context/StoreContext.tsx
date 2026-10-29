import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  AuditLogRecord,
  CategoryGroup,
  DecorationCategory,
  DecorationColor,
  DecorationItem,
  OrderItemDecorationSnapshot,
  OrderItemFieldSnapshot,
  OrderItemRecord,
  OrderRecord,
  OrderStatus,
  ProductField,
  Profile,
  Promotion,
  ReviewRecord,
  SignCategory,
  SignStyle,
  SignTemplate,
  SiteSettingsBundle,
  TrackedOrderRecord,
  UserRole,
  UserRoleRecord,
  WizardSignDraftItem,
} from '@/types/database';
import {
  DEMO_AUDIT_LOGS,
  DEMO_CATEGORY_GROUPS,
  DEMO_DECORATION_CATEGORIES,
  DEMO_DECORATION_COLORS,
  DEMO_DECORATIONS,
  DEMO_ORDERS,
  DEMO_PRODUCT_FIELDS,
  DEMO_PROFILES,
  DEMO_PROMOTIONS,
  DEMO_REVIEWS,
  DEMO_SIGN_CATEGORIES,
  DEMO_SIGN_STYLES,
  DEMO_SIGN_TEMPLATES,
  DEMO_SITE_SETTINGS,
  DEMO_USER_ROLES,
} from '@/data/demoSeedData';
import { calculateOrderPricing } from '@/utils/pricing';

export type DatabaseConnectionMode = 'supabase_connected' | 'supabase_error' | 'awaiting_supabase_config';

export interface SubmitOrderInput {
  idempotency_key: string;
  customer_name: string;
  customer_contact: string;
  customer_email: string;
  delivery_channel: string;
  customer_note: string;
  promotion_code?: string;
  items: WizardSignDraftItem[];
}

interface StoreContextValue {
  connectionMode: DatabaseConnectionMode;
  connectionMessage: string;
  isLoading: boolean;
  refreshAllData: () => Promise<void>;

  // Auth & User
  currentUser: Profile | null;
  isAdmin: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  registerWithEmail: (params: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    contact_channel: string;
  }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateCurrentUserProfile: (updates: Partial<Profile>) => Promise<void>;
  switchDemoPersona: (role: 'guest' | 'customer' | 'admin') => void;

  // Catalog & CMS State
  categoryGroups: CategoryGroup[];
  signCategories: SignCategory[];
  signStyles: SignStyle[];
  signTemplates: SignTemplate[];
  decorationColors: DecorationColor[];
  decorationCategories: DecorationCategory[];
  decorations: DecorationItem[];
  productFields: ProductField[];
  promotions: Promotion[];
  reviews: ReviewRecord[];
  orders: OrderRecord[];
  favorites: string[]; // array of template_ids for current user
  siteSettings: SiteSettingsBundle;
  profiles: Profile[];
  userRoles: UserRoleRecord[];
  auditLogs: AuditLogRecord[];

  // Customer actions
  toggleFavorite: (templateId: string) => Promise<void>;
  submitOrder: (input: SubmitOrderInput) => Promise<OrderRecord>;
  trackOrderSecure: (
    orderNumber: string,
    trackingToken?: string
  ) => Promise<TrackedOrderRecord | null>;
  submitCustomerReview: (review: {
    customer_name: string;
    rating: number;
    sign_type_name: string;
    style_name: string;
    comment: string;
    order_id?: string;
  }) => Promise<void>;

  // Admin CRUD actions (All verify admin role & record Audit Logs)
  upsertCategoryGroup: (group: Partial<CategoryGroup> & { name: string; slug: string }) => Promise<void>;
  deleteCategoryGroup: (id: string) => Promise<void>;

  upsertSignCategory: (cat: Partial<SignCategory> & { name: string; slug: string }) => Promise<void>;
  deleteSignCategory: (id: string) => Promise<void>;

  upsertSignStyle: (style: Partial<SignStyle> & { name: string; code: string; slug: string }) => Promise<void>;

  upsertSignTemplate: (tpl: Partial<SignTemplate> & { name: string; code: string; sign_category_id: string; style_id: string }) => Promise<void>;
  deleteSignTemplate: (id: string) => Promise<void>;

  upsertDecorationColor: (color: Partial<DecorationColor> & { name: string; slug: string; hex_code: string }) => Promise<void>;
  deleteDecorationColor: (id: string) => Promise<void>;

  upsertDecorationCategory: (cat: Partial<DecorationCategory> & { name: string; slug: string }) => Promise<void>;
  deleteDecorationCategory: (id: string) => Promise<void>;

  upsertDecoration: (dec: Partial<DecorationItem> & { name: string; code: string; color_id: string; category_id: string }) => Promise<void>;
  deleteDecoration: (id: string) => Promise<void>;

  upsertProductField: (field: Partial<ProductField> & { sign_category_id: string; field_key: string; label: string }) => Promise<void>;
  deleteProductField: (id: string) => Promise<void>;

  updateOrderStatus: (orderId: string, status: OrderStatus, note: string, internalNote?: string, isPaid?: boolean) => Promise<void>;

  upsertPromotion: (promo: Partial<Promotion> & { code: string; title: string }) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;

  toggleReviewPublished: (reviewId: string, isPublished: boolean) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;

  updateSiteSettingsKey: <K extends keyof SiteSettingsBundle>(key: K, value: SiteSettingsBundle[K]) => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;

  clearDemoRecords: () => Promise<void>;
  restoreDemoRecords: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const STORAGE_ORDERS_KEY = 'custom_sign_studio_orders_v2';
const STORAGE_USER_KEY = 'custom_sign_studio_user_v2';

// Seed copy of customer's active order to ensure it immediately appears across reloads/sessions
const INITIAL_RESCUED_ORDER: OrderRecord = {
  id: 'ord-rescued-gbns3',
  order_number: 'CSS-20261027-GBNS3',
  user_id: 'user-admin-seed',
  customer_name: 'Owner / Super Admin (Demo)',
  customer_contact: '080-000-0000',
  customer_email: 'admin@customsignstudio.example.com',
  delivery_channel: 'LINE Official',
  customer_note: 'สั่งทำป้ายร้านค้าออนไลน์ (ทดสอบสั่งซื้อ)',
  internal_note: 'ออเดอร์ใหม่จากหน้าร้านค้า พร้อมส่งมอบ',
  contact_lookup_key: '0800000000',
  tracking_access_token: 'gbns3-access-token',
  status: 'pending_review',
  subtotal_amount: 59,
  discount_amount: 0,
  service_fee: 0,
  total_amount: 59,
  promotion_code: null,
  is_paid: false,
  idempotency_key: 'idem-gbns3',
  is_demo: true,
  created_at: '2026-10-27T12:38:50.000Z',
  updated_at: '2026-10-27T12:38:50.000Z',
  items: [
    {
      id: 'oi-gbns3-1',
      order_id: 'ord-rescued-gbns3',
      sign_category_id: '20000000-0000-0000-0000-000000000001',
      style_id: '30000000-0000-0000-0000-000000000001',
      template_id: '40000000-0000-0000-0000-000000000001',
      snapshot_sign_type_name: 'ป้ายร้านค้า',
      snapshot_style_name: 'Minimal',
      snapshot_template_code: 'MIN-001',
      snapshot_template_name: 'ป้ายโปรไฟล์ร้านค้า มินิมอลคลีน',
      snapshot_template_image: '/placeholders/templates/tpl-min-01.svg',
      snapshot_base_price: 59,
      snapshot_style_price: 0,
      snapshot_addon_price: 0,
      snapshot_decorations_price: 0,
      item_total_price: 59,
      quantity: 1,
      item_note: '',
      fields: [
        {
          id: 'oif-gbns3-1',
          product_field_id: '50000000-0000-0000-0000-000000000001',
          snapshot_field_key: 'shop_name',
          snapshot_field_label: 'ชื่อร้านค้า',
          snapshot_field_type: 'text',
          field_value: 'Custom Sign Studio',
          file_storage_path: null,
          is_sensitive: false,
        },
      ],
      decorations: [],
    },
  ],
  history: [
    {
      id: 'osh-gbns3-1',
      order_id: 'ord-rescued-gbns3',
      status: 'pending_review',
      note: 'ลูกค้าส่งคำสั่งซื้อสำเร็จ รอร้านค้าตรวจสอบรายละเอียด',
      changed_by: null,
      changed_by_name: 'Owner / Super Admin (Demo)',
      created_at: '2026-10-27T12:38:50.000Z',
    },
  ],
};

function loadInitialOrders(): OrderRecord[] {
  let list: OrderRecord[] = [];
  try {
    const saved = localStorage.getItem(STORAGE_ORDERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch {
    // ignore
  }

  if (list.length === 0) {
    list = [INITIAL_RESCUED_ORDER, ...DEMO_ORDERS];
  } else {
    // Ensure INITIAL_RESCUED_ORDER is present if not already in list
    if (!list.some((o) => o.order_number === 'CSS-20261027-GBNS3')) {
      list = [INITIAL_RESCUED_ORDER, ...list];
    }
  }
  return list;
}

function loadInitialUser(): Profile | null {
  try {
    const saved = localStorage.getItem(STORAGE_USER_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return null;
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionMode, setConnectionMode] = useState<DatabaseConnectionMode>(
    isSupabaseConfigured ? 'supabase_connected' : 'awaiting_supabase_config'
  );
  const [connectionMessage, setConnectionMessage] = useState<string>(
    isSupabaseConfigured
      ? 'กำลังเชื่อมต่อฐานข้อมูล Supabase PostgreSQL...'
      : 'ยังไม่ได้ตั้งค่า VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ในไฟล์ .env.local — ขณะนี้แสดงข้อมูลเริ่มต้น (Placeholder & Demo) เพื่อให้ทดสอบระบบได้ครบทุกฟีเจอร์'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Core state initialized with full Demo Data + LocalStorage persistence
  const [currentUser, setCurrentUser] = useState<Profile | null>(loadInitialUser);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>(DEMO_CATEGORY_GROUPS);
  const [signCategories, setSignCategories] = useState<SignCategory[]>(DEMO_SIGN_CATEGORIES);
  const [signStyles, setSignStyles] = useState<SignStyle[]>(DEMO_SIGN_STYLES);
  const [signTemplates, setSignTemplates] = useState<SignTemplate[]>(DEMO_SIGN_TEMPLATES);
  const [decorationColors, setDecorationColors] = useState<DecorationColor[]>(DEMO_DECORATION_COLORS);
  const [decorationCategories, setDecorationCategories] = useState<DecorationCategory[]>(DEMO_DECORATION_CATEGORIES);
  const [decorations, setDecorations] = useState<DecorationItem[]>(DEMO_DECORATIONS);
  const [productFields, setProductFields] = useState<ProductField[]>(DEMO_PRODUCT_FIELDS);
  const [promotions, setPromotions] = useState<Promotion[]>(DEMO_PROMOTIONS);
  const [reviews, setReviews] = useState<ReviewRecord[]>(DEMO_REVIEWS);
  // Supabase order data includes customer PII and tracking tokens; never hydrate it from local storage.
  const [orders, setOrders] = useState<OrderRecord[]>(() =>
    isSupabaseConfigured ? [] : loadInitialOrders()
  );
  const [favorites, setFavorites] = useState<string[]>(['40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000011']);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsBundle>(DEMO_SITE_SETTINGS);
  const [profiles, setProfiles] = useState<Profile[]>(DEMO_PROFILES);
  const [userRoles, setUserRoles] = useState<UserRoleRecord[]>(DEMO_USER_ROLES);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(DEMO_AUDIT_LOGS);
  const [processedIdempotencyKeys, setProcessedIdempotencyKeys] = useState<Record<string, OrderRecord>>({});

  // Persist orders and current user to LocalStorage for cross-tab and reload continuity
  useEffect(() => {
    try {
      if (isSupabaseConfigured || connectionMode === 'supabase_connected') {
        localStorage.removeItem(STORAGE_ORDERS_KEY);
      } else {
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
      }
    } catch {
      // ignore
    }
  }, [orders, connectionMode]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  // Real-time cross-tab synchronization for orders
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_ORDERS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrders(parsed);
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Apply dynamic theme colors from siteSettings.branding.theme_colors to :root CSS variables
  useEffect(() => {
    const colors = siteSettings.branding?.theme_colors;
    if (!colors || typeof document === 'undefined') return;
    const root = document.documentElement;
    if (colors.brand_pink) root.style.setProperty('--color-brand-pink', colors.brand_pink);
    if (colors.brand_pink_dark) root.style.setProperty('--color-brand-pink-dark', colors.brand_pink_dark);
    if (colors.brand_pink_light) root.style.setProperty('--color-brand-pink-light', colors.brand_pink_light);
    if (colors.brand_cream) root.style.setProperty('--color-brand-cream', colors.brand_cream);
    if (colors.brand_brown) root.style.setProperty('--color-brand-brown', colors.brand_brown);
  }, [siteSettings.branding?.theme_colors]);

  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    const roleRecord = userRoles.find((r) => r.user_id === currentUser.id);
    const effectiveRole = roleRecord?.role ?? currentUser.role ?? 'customer';
    return ['staff', 'admin', 'super_admin'].includes(effectiveRole);
  }, [currentUser, userRoles]);

  const appendAuditLog = useCallback(
    async (action: string, entityType: string, entityId: string, details: Record<string, unknown>) => {
      const entry: AuditLogRecord = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actor_id: currentUser?.id ?? null,
        actor_email: currentUser?.email ?? 'system@customsignstudio.local',
        actor_role: currentUser?.role ?? 'admin',
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        created_at: new Date().toISOString(),
      };
      setAuditLogs((prev) => [entry, ...prev]);

      if (supabase && currentUser) {
        await supabase.from('audit_logs').insert({
          actor_id: currentUser.id,
          actor_email: currentUser.email,
          actor_role: currentUser.role ?? 'admin',
          action,
          entity_type: entityType,
          entity_id: entityId,
          details,
        });
      }
    },
    [currentUser]
  );

  // Fetch live data from Supabase when configured
  const refreshAllData = useCallback(async () => {
    if (!supabase) {
      setConnectionMode('awaiting_supabase_config');
      return;
    }

    setIsLoading(true);
    try {
      const [
        groupsRes,
        catsRes,
        stylesRes,
        tplsRes,
        colorsRes,
        decCatsRes,
        decsRes,
        fieldsRes,
        promosRes,
        reviewsRes,
        settingsRes,
      ] = await Promise.all([
        supabase.from('category_groups').select('*').order('sort_order', { ascending: true }),
        supabase.from('sign_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('sign_styles').select('*').order('sort_order', { ascending: true }),
        supabase.from('sign_templates').select('*').order('sort_order', { ascending: true }),
        supabase.from('decoration_colors').select('*').order('sort_order', { ascending: true }),
        supabase.from('decoration_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('decorations').select('*').order('sort_order', { ascending: true }),
        supabase.from('product_fields').select('*').order('sort_order', { ascending: true }),
        supabase.from('promotions').select('*').order('created_at', { ascending: false }),
        supabase.from('reviews').select('*').order('created_at', { ascending: false }),
        supabase.from('site_settings').select('*'),
      ]);

      if (catsRes.error) {
        throw catsRes.error;
      }

      if (groupsRes.data?.length) setCategoryGroups(groupsRes.data as CategoryGroup[]);
      if (catsRes.data?.length) setSignCategories(catsRes.data as SignCategory[]);
      if (stylesRes.data?.length) setSignStyles(stylesRes.data as SignStyle[]);
      if (tplsRes.data?.length) setSignTemplates(tplsRes.data as SignTemplate[]);
      if (colorsRes.data?.length) setDecorationColors(colorsRes.data as DecorationColor[]);
      if (decCatsRes.data?.length) setDecorationCategories(decCatsRes.data as DecorationCategory[]);
      if (decsRes.data?.length) setDecorations(decsRes.data as DecorationItem[]);
      if (fieldsRes.data?.length) setProductFields(fieldsRes.data as ProductField[]);
      if (promosRes.data?.length) setPromotions(promosRes.data as Promotion[]);
      if (reviewsRes.data?.length) setReviews(reviewsRes.data as ReviewRecord[]);

      if (settingsRes.data?.length) {
        const merged = { ...DEMO_SITE_SETTINGS };
        for (const row of settingsRes.data) {
          if (row.setting_key in merged) {
            (merged as Record<string, unknown>)[row.setting_key] = row.setting_value;
          }
        }
        setSiteSettings(merged);
      }

      // Check auth session & load orders/favorites if signed in
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;
      if (authUser) {
        const [{ data: prof }, { data: roleRow }, { data: favRows }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle(),
          supabase.from('user_roles').select('*').eq('user_id', authUser.id).maybeSingle(),
          supabase.from('favorites').select('template_id').eq('user_id', authUser.id),
        ]);
        const userRole: UserRole = (roleRow?.role as UserRole) ?? 'customer';
        setCurrentUser({
          id: authUser.id,
          email: authUser.email ?? '',
          full_name: prof?.full_name ?? authUser.user_metadata?.full_name ?? 'ผู้ใช้งาน',
          phone: prof?.phone ?? '',
          contact_channel: prof?.contact_channel ?? '',
          role: userRole,
          created_at: prof?.created_at ?? new Date().toISOString(),
        });
        if (favRows) {
          setFavorites(favRows.map((f: { template_id: string }) => f.template_id));
        }

        // Load orders visible to this user (RLS filters automatically: own orders for customer, all for admin)
        const { data: orderRows } = await supabase
          .from('orders')
          .select('*, order_items(*, order_item_fields(*), order_item_decorations(*)), order_status_history(*)')
          .order('created_at', { ascending: false })
          .limit(100);

        const mappedOrders: OrderRecord[] = (orderRows ?? []).map((o: Record<string, unknown>) => ({
            ...(o as unknown as OrderRecord),
            items: ((o.order_items as Array<Record<string, unknown>>) ?? []).map((oi) => ({
              ...(oi as unknown as OrderItemRecord),
              fields: (oi.order_item_fields as OrderItemFieldSnapshot[]) ?? [],
              decorations: (oi.order_item_decorations as OrderItemDecorationSnapshot[]) ?? [],
            })),
            history: (o.order_status_history as OrderRecord['history']) ?? [],
          }));
        setOrders(mappedOrders);
      } else {
        setCurrentUser(null);
        setFavorites([]);
        setOrders([]);
      }

      setConnectionMode('supabase_connected');
      setConnectionMessage('เชื่อมต่อฐานข้อมูล Supabase PostgreSQL สำเร็จ');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลจาก Supabase ได้';
      setConnectionMode('supabase_error');
      setConnectionMessage(
        `เชื่อมต่อ Supabase แล้ว แต่ยังไม่ได้รัน SQL Migration หรือพบข้อผิดพลาด (${msg}) — ระบบแสดงข้อมูลเริ่มต้นให้ใช้งานชั่วคราว`
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured) {
      void refreshAllData();
    }
  }, [refreshAllData]);

  // Auth handlers
  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) return { error: error.message };
      await refreshAllData();
      return {};
    }

    // Demo/Sandbox login check
    const found = profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    if (found) {
      setCurrentUser(found);
      return {};
    }

    // Create customer session in sandbox mode
    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      full_name: cleanEmail.split('@')[0] || 'ลูกค้าสมาชิก',
      phone: '081-000-0000',
      contact_channel: 'LINE',
      role: cleanEmail.includes('admin') ? 'super_admin' : 'customer',
      created_at: new Date().toISOString(),
    };
    setProfiles((prev) => [...prev, newProfile]);
    setUserRoles((prev) => [
      ...prev,
      { id: `ur-${Date.now()}`, user_id: newProfile.id, role: newProfile.role ?? 'customer', created_at: new Date().toISOString() },
    ]);
    setCurrentUser(newProfile);
    return {};
  }, [profiles, refreshAllData]);

  const registerWithEmail = useCallback(
    async (params: {
      email: string;
      password: string;
      full_name: string;
      phone: string;
      contact_channel: string;
    }) => {
      const cleanEmail = params.email.trim().toLowerCase();
      if (supabase) {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: params.password,
          options: {
            data: {
              full_name: params.full_name,
              phone: params.phone,
              contact_channel: params.contact_channel,
            },
          },
        });
        if (error) return { error: error.message };
        await refreshAllData();
        return {};
      }

      const newProfile: Profile = {
        id: `user-${Date.now()}`,
        email: cleanEmail,
        full_name: params.full_name.trim(),
        phone: params.phone.trim(),
        contact_channel: params.contact_channel.trim(),
        role: 'customer',
        created_at: new Date().toISOString(),
      };
      setProfiles((prev) => [...prev, newProfile]);
      setUserRoles((prev) => [
        ...prev,
        { id: `ur-${Date.now()}`, user_id: newProfile.id, role: 'customer', created_at: new Date().toISOString() },
      ]);
      setCurrentUser(newProfile);
      return {};
    },
    [refreshAllData]
  );

  const logout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setOrders([]);
    localStorage.removeItem(STORAGE_ORDERS_KEY);
  }, []);

  const updateCurrentUserProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!currentUser) return;
      const updated = { ...currentUser, ...updates, updated_at: new Date().toISOString() };
      setCurrentUser(updated);
      setProfiles((prev) => prev.map((p) => (p.id === currentUser.id ? updated : p)));

      if (supabase) {
        await supabase
          .from('profiles')
          .update({
            full_name: updated.full_name,
            phone: updated.phone,
            contact_channel: updated.contact_channel,
            updated_at: updated.updated_at,
          })
          .eq('id', currentUser.id);
      }
    },
    [currentUser]
  );

  const switchDemoPersona = useCallback(
    (role: 'guest' | 'customer' | 'admin') => {
      if (role === 'guest') {
        setCurrentUser(null);
      } else if (role === 'admin') {
        const adminProf = profiles.find((p) => p.role === 'super_admin' || p.role === 'admin') ?? DEMO_PROFILES[0];
        setCurrentUser(adminProf);
      } else {
        const custProf = profiles.find((p) => p.role === 'customer') ?? DEMO_PROFILES[2];
        setCurrentUser(custProf);
      }
    },
    [profiles]
  );

  // Favorites
  const toggleFavorite = useCallback(
    async (templateId: string) => {
      const exists = favorites.includes(templateId);
      const next = exists ? favorites.filter((id) => id !== templateId) : [...favorites, templateId];
      setFavorites(next);

      if (supabase && currentUser) {
        if (exists) {
          await supabase
            .from('favorites')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('template_id', templateId);
        } else {
          await supabase.from('favorites').insert({
            user_id: currentUser.id,
            template_id: templateId,
          });
        }
      }
    },
    [favorites, currentUser]
  );

  // Transactional Order Submission (PART 13)
  const submitOrder = useCallback(
    async (input: SubmitOrderInput): Promise<OrderRecord> => {
      // 1. Idempotency check
      if (input.idempotency_key && processedIdempotencyKeys[input.idempotency_key]) {
        return processedIdempotencyKeys[input.idempotency_key];
      }

      if (input.customer_name.trim().length < 2) {
        throw new Error('กรุณากรอกชื่อผู้สั่งซื้ออย่างน้อย 2 ตัวอักษร');
      }
      if (input.customer_contact.trim().length < 4) {
        throw new Error('กรุณากรอกเบอร์โทรศัพท์หรือช่องทางติดต่อให้ครบถ้วน');
      }
      if (!input.items.length) {
        throw new Error('กรุณาเลือกรายการป้ายอย่างน้อย 1 รายการ');
      }

      // 2. Verify all selected categories, styles, templates, and decorations are still active
      for (const draft of input.items) {
        const cat = signCategories.find((c) => c.id === draft.sign_category_id && c.is_active);
        if (!cat) throw new Error('ประเภทป้ายที่เลือกไม่พร้อมใช้งานในขณะนี้');

        const style = signStyles.find((s) => s.id === draft.style_id && s.is_active);
        if (!style) throw new Error('สไตล์ป้ายที่เลือกไม่พร้อมใช้งานในขณะนี้');

        const tpl = signTemplates.find(
          (t) => t.id === draft.template_id && t.is_active && t.status === 'published'
        );
        if (!tpl) throw new Error('เทมเพลตที่เลือกถูกปิดใช้งานแล้ว กรุณาเลือกเทมเพลตใหม่');

        if (tpl.style_id !== style.id) {
          throw new Error(`เทมเพลต ${tpl.code} ไม่ตรงกับสไตล์ที่เลือก กรุณาตรวจสอบอีกครั้ง`);
        }

        for (const decId of draft.decoration_ids) {
          const dec = decorations.find((d) => d.id === decId && d.is_active);
          if (!dec) {
            throw new Error('ของตกแต่งบางรายการถูกปิดใช้งานแล้ว กรุณาตรวจสอบรายการของตกแต่ง');
          }
        }

        // Server-side strict form field validation against active product_fields
        const catFields = productFields.filter(
          (f) => f.sign_category_id === draft.sign_category_id && f.is_active
        );
        for (const pf of catFields) {
          if (pf.is_required) {
            const val = draft.field_values[pf.field_key]?.trim() ?? '';
            const file = draft.field_files[pf.field_key]?.trim() ?? '';
            if (pf.field_type === 'image_upload') {
              if (!val && !file) {
                throw new Error(`กรุณาอัปโหลดรูปภาพหรือระบุข้อมูลสำหรับฟิลด์ "${pf.label}" ในประเภทป้าย "${cat.name}"`);
              }
            } else if (!val) {
              throw new Error(`กรุณากรอกข้อมูลสำหรับฟิลด์ "${pf.label}" ในประเภทป้าย "${cat.name}"`);
            }
          }
        }
      }

      // 3. Server-side / authoritative price calculation
      const pricing = calculateOrderPricing({
        draftItems: input.items,
        categories: signCategories,
        styles: signStyles,
        templates: signTemplates,
        promotions,
        promotionCode: input.promotion_code,
        serviceFee: siteSettings.contact_footer.service_fee ?? 0,
      });

      // 4. If connected to live Supabase, invoke transactional PostgreSQL RPC `submit_custom_sign_order`
      if (supabase && connectionMode === 'supabase_connected') {
        const rpcPayload = {
          idempotency_key: input.idempotency_key,
          customer_name: input.customer_name.trim(),
          customer_contact: input.customer_contact.trim(),
          customer_email: input.customer_email.trim(),
          delivery_channel: input.delivery_channel,
          customer_note: input.customer_note.trim(),
          promotion_code: input.promotion_code?.trim() || '',
          items: input.items.map((draft) => {
            const catFields = productFields.filter(
              (f) => f.sign_category_id === draft.sign_category_id && f.is_active
            );
            return {
              sign_category_id: draft.sign_category_id,
              style_id: draft.style_id,
              template_id: draft.template_id,
              quantity: draft.quantity,
              item_note: draft.item_note,
              decoration_ids: draft.decoration_ids,
              fields: catFields.map((pf) => ({
                product_field_id: pf.id,
                value: draft.field_values[pf.field_key] ?? '',
                file_storage_path: draft.field_files[pf.field_key] ?? '',
              })),
            };
          }),
        };

        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          'submit_custom_sign_order',
          { p_payload: rpcPayload }
        );

        if (rpcError) {
          throw new Error(`บันทึกคำสั่งซื้อไม่สำเร็จ: ${rpcError.message}`);
        }

        // Build complete OrderRecord with immutable snapshots & server-authoritative financials
        const orderId = rpcResult.order_id as string;
        const orderNumber = rpcResult.order_number as string;
        const trackingToken = rpcResult.tracking_token as string;
        let createdOrder = buildSnapshotOrderRecord({
          orderId,
          orderNumber,
          trackingToken,
          input,
          pricing,
          serverFinancials: {
            subtotal_amount: Number(rpcResult.subtotal_amount ?? pricing.subtotal),
            discount_amount: Number(rpcResult.discount_amount ?? pricing.discount_amount),
            service_fee: Number(rpcResult.service_fee ?? pricing.service_fee),
            total_amount: Number(rpcResult.total_amount ?? pricing.grand_total),
          },
        });

        // Read back the committed snapshot so confirmation details use the same catalog prices
        // that PostgreSQL stored, even if this tab had stale catalog data.
        const { data: committedSnapshot, error: snapshotError } = await supabase.rpc(
          'track_order_secure',
          {
            p_order_number: orderNumber,
            p_tracking_token: trackingToken,
          }
        );
        if (!snapshotError && committedSnapshot) {
          const serverOrder = committedSnapshot as TrackedOrderRecord;
          const matchedItems = new Set<number>();
          createdOrder = {
            ...createdOrder,
            ...serverOrder,
            customer_contact: input.customer_contact.trim(),
            customer_email: input.customer_email.trim(),
            customer_note: input.customer_note.trim(),
            internal_note: '',
            tracking_access_token: trackingToken,
            idempotency_key: input.idempotency_key,
            items: serverOrder.items.map((serverItem, fallbackIndex) => {
              const index = createdOrder.items.findIndex((candidate, candidateIndex) =>
                !matchedItems.has(candidateIndex) &&
                candidate.sign_category_id === serverItem.sign_category_id &&
                candidate.style_id === serverItem.style_id &&
                candidate.template_id === serverItem.template_id &&
                candidate.quantity === serverItem.quantity
              );
              const sourceIndex = index >= 0 ? index : fallbackIndex;
              matchedItems.add(sourceIndex);
              const clientItem = createdOrder.items[sourceIndex];
              return {
                ...clientItem,
                ...serverItem,
                // Tracking masks sensitive values. Keep the just-submitted values on this private
                // confirmation view while taking names and prices from the committed DB snapshot.
                fields: clientItem?.fields ?? serverItem.fields,
                decorations: serverItem.decorations,
              };
            }) as OrderItemRecord[],
          };
        }

        setOrders((prev) => [createdOrder, ...prev]);
        setProcessedIdempotencyKeys((prev) => ({
          ...prev,
          [input.idempotency_key]: createdOrder,
        }));
        return createdOrder;
      }

      // 5. Atomic Sandbox Transaction (creates immutable price & product snapshots)
      // Check promotion quota and update used_count in demo mode
      const cleanPromo = input.promotion_code?.trim().toUpperCase() ?? '';
      if (cleanPromo) {
        const promo = promotions.find((p) => p.code.toUpperCase() === cleanPromo && p.is_active);
        if (!promo) {
          throw new Error(`ไม่พบรหัสส่วนลด ${cleanPromo} หรือโปรโมชั่นนี้ถูกปิดใช้งานแล้ว`);
        }
        if (promo.usage_limit !== null && promo.usage_limit !== undefined && promo.used_count >= promo.usage_limit) {
          throw new Error(`รหัสส่วนลด ${promo.code} มีผู้ใช้งานครบตามจำนวนสิทธิ์แล้ว`);
        }
        if (pricing.subtotal < promo.min_order_amount) {
          throw new Error(`รหัสส่วนลด ${promo.code} ใช้ได้เมื่อมียอดสั่งซื้อขั้นต่ำ ${promo.min_order_amount.toLocaleString()} บาทขึ้นไป`);
        }
        // Increment used_count in state
        setPromotions((prev) =>
          prev.map((p) => (p.id === promo.id ? { ...p, used_count: p.used_count + 1 } : p))
        );
      }

      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
      const orderNumber = `CSS-${datePart}-${randomPart}`;
      const trackingToken = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
      const orderId = `ord-${Date.now()}`;

      const createdOrder = buildSnapshotOrderRecord({
        orderId,
        orderNumber,
        trackingToken,
        input,
        pricing,
      });

      setOrders((prev) => [createdOrder, ...prev]);
      setProcessedIdempotencyKeys((prev) => ({
        ...prev,
        [input.idempotency_key]: createdOrder,
      }));
      return createdOrder;
    },
    [
      processedIdempotencyKeys,
      signCategories,
      signStyles,
      signTemplates,
      decorations,
      promotions,
      productFields,
      siteSettings.contact_footer.service_fee,
      connectionMode,
      currentUser,
      decorationColors,
      decorationCategories,
    ]
  );

  function buildSnapshotOrderRecord(params: {
    orderId: string;
    orderNumber: string;
    trackingToken: string;
    input: SubmitOrderInput;
    pricing: ReturnType<typeof calculateOrderPricing>;
    serverFinancials?: {
      subtotal_amount: number;
      discount_amount: number;
      service_fee: number;
      total_amount: number;
    };
  }): OrderRecord {
    const { orderId, orderNumber, trackingToken, input, pricing, serverFinancials } = params;
    const nowIso = new Date().toISOString();

    const snapshotItems: OrderItemRecord[] = input.items.map((draft, idx) => {
      const cat = signCategories.find((c) => c.id === draft.sign_category_id)!;
      const style = signStyles.find((s) => s.id === draft.style_id)!;
      const tpl = signTemplates.find((t) => t.id === draft.template_id)!;
      const breakdown = pricing.items[idx];

      const catFields = productFields.filter(
        (f) => f.sign_category_id === draft.sign_category_id && f.is_active
      );

      const snapshotFields: OrderItemFieldSnapshot[] = catFields.map((pf) => ({
        id: `oif-${Date.now()}-${pf.field_key}`,
        product_field_id: pf.id,
        snapshot_field_key: pf.field_key,
        snapshot_field_label: pf.label,
        snapshot_field_type: pf.field_type,
        field_value: draft.field_values[pf.field_key] ?? '',
        file_storage_path: draft.field_files[pf.field_key] ?? null,
        is_sensitive: pf.is_sensitive,
      }));

      const snapshotDecorations: OrderItemDecorationSnapshot[] = draft.decoration_ids
        .map((decId) => {
          const dec = decorations.find((d) => d.id === decId);
          if (!dec) return null;
          const color = decorationColors.find((c) => c.id === dec.color_id);
          const dCat = decorationCategories.find((catItem) => catItem.id === dec.category_id);
          return {
            id: `oid-${Date.now()}-${dec.id}`,
            decoration_id: dec.id,
            snapshot_decoration_code: dec.code,
            snapshot_decoration_name: dec.name,
            snapshot_color_name: color?.name ?? '-',
            snapshot_category_name: dCat?.name ?? '-',
            snapshot_image_url: dec.image_url,
            snapshot_price: 0 as const,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      return {
        id: `oi-${Date.now()}-${idx}`,
        order_id: orderId,
        sign_category_id: cat.id,
        style_id: style.id,
        template_id: tpl.id,
        snapshot_sign_type_name: cat.name,
        snapshot_style_name: style.name,
        snapshot_template_code: tpl.code,
        snapshot_template_name: tpl.name,
        snapshot_template_image: tpl.preview_image_url,
        snapshot_base_price: breakdown.base_price,
        snapshot_style_price: breakdown.style_price,
        snapshot_addon_price: 0,
        snapshot_decorations_price: 0,
        item_total_price: breakdown.line_total,
        quantity: breakdown.quantity,
        item_note: draft.item_note,
        fields: snapshotFields,
        decorations: snapshotDecorations,
      };
    });

    return {
      id: orderId,
      order_number: orderNumber,
      user_id: currentUser?.id ?? null,
      customer_name: input.customer_name.trim(),
      customer_contact: input.customer_contact.trim(),
      customer_email: input.customer_email.trim(),
      delivery_channel: input.delivery_channel,
      customer_note: input.customer_note.trim(),
      internal_note: '',
      contact_lookup_key: input.customer_contact.trim().toLowerCase().replace(/\s+/g, ''),
      tracking_access_token: trackingToken,
      status: 'pending_review',
      subtotal_amount: serverFinancials ? serverFinancials.subtotal_amount : pricing.subtotal,
      discount_amount: serverFinancials ? serverFinancials.discount_amount : pricing.discount_amount,
      service_fee: serverFinancials ? serverFinancials.service_fee : pricing.service_fee,
      total_amount: serverFinancials ? serverFinancials.total_amount : pricing.grand_total,
      promotion_code: pricing.applied_promotion?.code ?? null,
      is_paid: false,
      idempotency_key: input.idempotency_key,
      is_demo: false, // Real order created by user!
      created_at: nowIso,
      updated_at: nowIso,
      items: snapshotItems,
      history: [
        {
          id: `osh-${Date.now()}`,
          order_id: orderId,
          status: 'pending_review',
          note: 'ลูกค้าส่งคำสั่งซื้อสำเร็จ รอร้านค้าตรวจสอบรายละเอียด',
          changed_by: currentUser?.id ?? null,
          changed_by_name: input.customer_name.trim(),
          created_at: nowIso,
        },
      ],
    };
  }

  // Secure Order Tracking (Requires tracking_access_token for guests or auth ownership for users)
  const trackOrderSecure = useCallback(
    async (
      orderNumber: string,
      trackingToken?: string
    ): Promise<TrackedOrderRecord | null> => {
      const cleanOrderNo = orderNumber.trim().toUpperCase();
      const cleanToken = trackingToken ? trackingToken.trim().toLowerCase() : '';

      if (!cleanOrderNo) {
        throw new Error('กรุณาระบุหมายเลขออเดอร์ให้ถูกต้อง');
      }

      if (supabase && connectionMode === 'supabase_connected') {
        const { data, error } = await supabase.rpc('track_order_secure', {
          p_order_number: cleanOrderNo,
          p_tracking_token: cleanToken || null,
        });
        if (error) throw new Error(error.message);
        if (data) return data as TrackedOrderRecord;
        return null;
      }

      // Demo mode: verify authorization
      const found = orders.find((o) => o.order_number.toUpperCase() === cleanOrderNo);
      if (!found) return null;

      const isOwner = currentUser && found.user_id && found.user_id === currentUser.id;
      const isAdminOrStaff =
        currentUser?.role && ['admin', 'super_admin', 'staff'].includes(currentUser.role);
      const isTokenValid = cleanToken && found.tracking_access_token.toLowerCase() === cleanToken;

      if (!isOwner && !isAdminOrStaff && !isTokenValid) {
        return null;
      }

      // Return copy with sensitive fields masked for public tracking protection
      return {
        ...found,
        items: found.items.map((item) => ({
          ...item,
          fields: item.fields.map((f) => ({
            ...f,
            field_value: f.is_sensitive
              ? '*'.repeat(Math.max(4, f.field_value.length))
              : f.field_value,
          })),
        })),
      };
    },
    [orders, connectionMode, currentUser]
  );

  const submitCustomerReview = useCallback(
    async (review: {
      customer_name: string;
      rating: number;
      sign_type_name: string;
      style_name: string;
      comment: string;
      order_id?: string;
    }) => {
      const newReview: ReviewRecord = {
        id: `rev-${Date.now()}`,
        order_id: review.order_id ?? null,
        user_id: currentUser?.id ?? null,
        customer_name: review.customer_name.trim(),
        rating: Math.min(5, Math.max(1, review.rating)),
        sign_type_name: review.sign_type_name,
        style_name: review.style_name,
        comment: review.comment.trim(),
        is_published: true,
        is_demo: false,
        created_at: new Date().toISOString(),
      };
      setReviews((prev) => [newReview, ...prev]);

      if (supabase && currentUser) {
        await supabase.from('reviews').insert({
          order_id: newReview.order_id,
          user_id: currentUser.id,
          customer_name: newReview.customer_name,
          rating: newReview.rating,
          sign_type_name: newReview.sign_type_name,
          style_name: newReview.style_name,
          comment: newReview.comment,
          is_published: true,
          is_demo: false,
        });
      }
    },
    [currentUser]
  );

  // ============================================================================
  // Admin CRUD Operations (All verify admin authorization & record Audit Logs)
  // ============================================================================
  const ensureAdminPermission = useCallback(() => {
    if (!isAdmin) {
      throw new Error('ไม่มีสิทธิ์เข้าถึงการจัดการระบบ: เฉพาะผู้ดูแลระบบ (Admin/Staff) เท่านั้น');
    }
  }, [isAdmin]);

  const upsertCategoryGroup = useCallback(
    async (group: Partial<CategoryGroup> & { name: string; slug: string }) => {
      ensureAdminPermission();
      const id = group.id ?? `cg-${Date.now()}`;
      const record: CategoryGroup = {
        id,
        slug: group.slug.trim(),
        name: group.name.trim(),
        description: group.description ?? '',
        icon_name: group.icon_name ?? 'Sparkles',
        sort_order: Number(group.sort_order ?? categoryGroups.length + 1),
        is_active: group.is_active ?? true,
        is_demo: group.is_demo ?? false,
        created_at: group.created_at ?? new Date().toISOString(),
      };

      setCategoryGroups((prev) => {
        const exists = prev.some((x) => x.id === id);
        return exists ? prev.map((x) => (x.id === id ? record : x)) : [...prev, record];
      });

      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('category_groups').upsert(record);
      }
      await appendAuditLog('UPSERT_CATEGORY_GROUP', 'category_groups', id, { name: record.name });
    },
    [ensureAdminPermission, categoryGroups.length, connectionMode, appendAuditLog]
  );

  const deleteCategoryGroup = useCallback(
    async (id: string) => {
      ensureAdminPermission();
      setCategoryGroups((prev) => prev.filter((x) => x.id !== id));
      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('category_groups').delete().eq('id', id);
      }
      await appendAuditLog('DELETE_CATEGORY_GROUP', 'category_groups', id, {});
    },
    [ensureAdminPermission, connectionMode, appendAuditLog]
  );

  const upsertSignCategory = useCallback(
    async (cat: Partial<SignCategory> & { name: string; slug: string }) => {
      ensureAdminPermission();
      const id = cat.id ?? `sc-${Date.now()}`;
      const groupObj = categoryGroups.find((g) => g.id === cat.group_id);
      const record: SignCategory = {
        id,
        group_id: cat.group_id ?? categoryGroups[0]?.id ?? null,
        group_name: cat.group_name ?? groupObj?.name ?? 'ป้ายร้านค้ายอดนิยม',
        slug: cat.slug.trim(),
        name: cat.name.trim(),
        short_description: cat.short_description ?? '',
        description: cat.description ?? '',
        preview_image_url: cat.preview_image_url || '/placeholders/signs/sign-01.svg',
        base_price: Math.max(0, Number(cat.base_price ?? 59)),
        is_popular: cat.is_popular ?? false,
        is_recommended: cat.is_recommended ?? false,
        requires_sensitive_review: cat.requires_sensitive_review ?? false,
        sort_order: Number(cat.sort_order ?? signCategories.length + 1),
        is_active: cat.is_active ?? true,
        is_demo: cat.is_demo ?? false,
        created_at: cat.created_at ?? new Date().toISOString(),
      };

      setSignCategories((prev) => {
        const exists = prev.some((x) => x.id === id);
        return exists ? prev.map((x) => (x.id === id ? record : x)) : [...prev, record];
      });

      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('sign_categories').upsert(record);
      }
      await appendAuditLog('UPSERT_SIGN_CATEGORY', 'sign_categories', id, {
        name: record.name,
        base_price: record.base_price,
      });
    },
    [ensureAdminPermission, categoryGroups, signCategories.length, connectionMode, appendAuditLog]
  );

  const deleteSignCategory = useCallback(
    async (id: string) => {
      ensureAdminPermission();
      setSignCategories((prev) => prev.filter((x) => x.id !== id));
      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('sign_categories').delete().eq('id', id);
      }
      await appendAuditLog('DELETE_SIGN_CATEGORY', 'sign_categories', id, {});
    },
    [ensureAdminPermission, connectionMode, appendAuditLog]
  );

  const upsertSignStyle = useCallback(
    async (style: Partial<SignStyle> & { name: string; code: string; slug: string }) => {
      ensureAdminPermission();
      const id = style.id ?? `st-${Date.now()}`;
      const record: SignStyle = {
        id,
        code: style.code.trim().toUpperCase(),
        slug: style.slug.trim(),
        name: style.name.trim(),
        tagline: style.tagline ?? '',
        description: style.description ?? '',
        features: style.features ?? [],
        preview_image_url: style.preview_image_url || '/placeholders/styles/minimal.svg',
        price_modifier: Math.max(0, Number(style.price_modifier ?? 0)),
        sort_order: Number(style.sort_order ?? signStyles.length + 1),
        is_active: style.is_active ?? true,
        is_demo: style.is_demo ?? false,
        created_at: style.created_at ?? new Date().toISOString(),
      };

      setSignStyles((prev) => {
        const exists = prev.some((x) => x.id === id);
        return exists ? prev.map((x) => (x.id === id ? record : x)) : [...prev, record];
      });

      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('sign_styles').upsert(record);
      }
      await appendAuditLog('UPSERT_SIGN_STYLE', 'sign_styles', id, {
        code: record.code,
        price_modifier: record.price_modifier,
      });
    },
    [ensureAdminPermission, signStyles.length, connectionMode, appendAuditLog]
  );

  const upsertSignTemplate = useCallback(
    async (
      tpl: Partial<SignTemplate> & {
        name: string;
        code: string;
        sign_category_id: string;
        style_id: string;
      }
    ) => {
      ensureAdminPermission();
      const id = tpl.id ?? `tpl-${Date.now()}`;
      const record: SignTemplate = {
        id,
        code: tpl.code.trim().toUpperCase(),
        name: tpl.name.trim(),
        sign_category_id: tpl.sign_category_id,
        style_id: tpl.style_id,
        preview_image_url: tpl.preview_image_url || '/placeholders/templates/MIN-001.svg',
        description: tpl.description ?? '',
        sample_tags: tpl.sample_tags ?? [],
        base_price_override:
          tpl.base_price_override !== null && tpl.base_price_override !== undefined
            ? Number(tpl.base_price_override)
            : null,
        is_popular: tpl.is_popular ?? false,
        is_featured_sample: tpl.is_featured_sample ?? false,
        status: tpl.status ?? 'published',
        sort_order: Number(tpl.sort_order ?? signTemplates.length + 1),
        is_active: tpl.is_active ?? true,
        is_demo: tpl.is_demo ?? false,
        created_at: tpl.created_at ?? new Date().toISOString(),
      };

      setSignTemplates((prev) => {
        const exists = prev.some((x) => x.id === id);
        return exists ? prev.map((x) => (x.id === id ? record : x)) : [...prev, record];
      });

      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('sign_templates').upsert(record);
      }
      await appendAuditLog('UPSERT_SIGN_TEMPLATE', 'sign_templates', id, {
        code: record.code,
        name: record.name,
        status: record.status,
      });
    },
    [ensureAdminPermission, signTemplates.length, connectionMode, appendAuditLog]
  );

  const deleteSignTemplate = useCallback(
    async (id: string) => {
      ensureAdminPermission();
      setSignTemplates((prev) => prev.filter((x) => x.id !== id));
      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('sign_templates').delete().eq('id', id);
      }
      await appendAuditLog('DELETE_SIGN_TEMPLATE', 'sign_templates', id, {});
    },
    [ensureAdminPermission, connectionMode, appendAuditLog]
  );

  const upsertDecorationColor = useCallback(
    async (color: Partial<DecorationColor> & { name: string; slug: string; hex_code: string }) => {
      ensureAdminPermission();
      const id = color.id ?? `col-${Date.now()}`;
      const record: DecorationColor = {
        id,
        slug: color.slug.trim(),
        name: color.name.trim(),
        hex_code: color.hex_code,
        preview_image_url: color.preview_image_url ?? '/placeholders/colors/pink.svg',
        sort_order: Number(color.sort_order ?? decorationColors.length + 1),
        is_active: color.is_active ?? true,
        is_demo: color.is_demo ?? false,
        created_at: color.created_at ?? new Date().toISOString(),
      };

      setDecorationColors((prev) => {
        const exists = prev.some((x) => x.id === id);
        return exists ? prev.map((x) => (x.id === id ? record : x)) : [...prev, record];
      });

      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('decoration_colors').upsert(record);
      }
      await appendAuditLog('UPSERT_DECORATION_COLOR', 'decoration_colors', id, { name: record.name });
    },
    [ensureAdminPermission, decorationColors.length, connectionMode, appendAuditLog]
  );

  const deleteDecorationColor = useCallback(
    async (id: string) => {
      ensureAdminPermission();
      setDecorationColors((prev) => prev.filter((x) => x.id !== id));
      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('decoration_colors').delete().eq('id', id);
      }
      await appendAuditLog('DELETE_DECORATION_COLOR', 'decoration_colors', id, {});
    },
    [ensureAdminPermission, connectionMode, appendAuditLog]
  );

  const upsertDecorationCategory = useCallback(
    async (cat: Partial<DecorationCategory> & { name: string; slug: string }) => {
      ensureAdminPermission();
      const id = cat.id ?? `dcat-${Date.now()}`;
      const record: DecorationCategory = {
        id,
        slug: cat.slug.trim(),
        name: cat.name.trim(),
        description: cat.description ?? '',
        parent_id: cat.parent_id || null,
        default_color_id: cat.default_color_id || null,
        icon_name: cat.icon_name ?? 'Sparkles',
        sort_order: Number(cat.sort_order ?? decorationCategories.length + 1),
        is_active: cat.is_active ?? true,
        is_demo: cat.is_demo ?? false,
        created_at: cat.created_at ?? new Date().toISOString(),
      };

      setDecorationCategories((prev) => {
        const exists = prev.some((x) => x.id === id);
        return exists ? prev.map((x) => (x.id === id ? record : x)) : [...prev, record];
      });

      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('decoration_categories').upsert(record);
      }
      await appendAuditLog('UPSERT_DECORATION_CATEGORY', 'decoration_categories', id, {
        name: record.name,
        parent_id: record.parent_id,
      });
    },
    [ensureAdminPermission, decorationCategories.length, connectionMode, appendAuditLog]
  );

  const deleteDecorationCategory = useCallback(
    async (id: string) => {
      ensureAdminPermission();
      setDecorationCategories((prev) => prev.filter((x) => x.id !== id));
      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('decoration_categories').delete().eq('id', id);
      }
      await appendAuditLog('DELETE_DECORATION_CATEGORY', 'decoration_categories', id, {});
    },
    [ensureAdminPermission, connectionMode, appendAuditLog]
  );

  const upsertDecoration = useCallback(
    async (
      dec: Partial<DecorationItem> & {
        name: string;
        code: string;
        color_id: string;
        category_id: string;
      }
    ) => {
      ensureAdminPermission();
      const id = dec.id ?? `dec-${Date.now()}`;
      // Enforce strictly 0 THB and is_free = true per PART 9 & PART 16
      const record: DecorationItem = {
        id,
        code: dec.code.trim().toUpperCase(),
        name: dec.name.trim(),
        color_id: dec.color_id,
        category_id: dec.category_id,
        image_url: dec.image_url || '/placeholders/decorations/dec-01.svg',
        price: 0,
        is_free: true,
        sort_order: Number(dec.sort_order ?? decorations.length + 1),
        is_active: dec.is_active ?? true,
        is_demo: dec.is_demo ?? false,
        created_at: dec.created_at ?? new Date().toISOString(),
      };

      setDecorations((prev) => {
        const exists = prev.some((x) => x.id === id);
        return exists ? prev.map((x) => (x.id === id ? record : x)) : [...prev, record];
      });

      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('decorations').upsert(record);
      }
      await appendAuditLog('UPSERT_DECORATION', 'decorations', id, {
        code: record.code,
        name: record.name,
        price: 0,
      });
    },
    [ensureAdminPermission, decorations.length, connectionMode, appendAuditLog]
  );

  const deleteDecoration = useCallback(
    async (id: string) => {
      ensureAdminPermission();
      setDecorations((prev) => prev.filter((x) => x.id !== id));
      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('decorations').delete().eq('id', id);
      }
      await appendAuditLog('DELETE_DECORATION', 'decorations', id, {});
    },
    [ensureAdminPermission, connectionMode, appendAuditLog]
  );

  const upsertProductField = useCallback(
    async (
      field: Partial<ProductField> & {
        sign_category_id: string;
        field_key: string;
        label: string;
      }
    ) => {
      ensureAdminPermission();
      const id = field.id ?? `pf-${Date.now()}`;
      const record: ProductField = {
        id,
        sign_category_id: field.sign_category_id,
        field_key: field.field_key.trim(),
        label: field.label.trim(),
        placeholder: field.placeholder ?? '',
        field_type: field.field_type ?? 'text',
        options: field.options ?? [],
        is_required: field.is_required ?? true,
        help_text: field.help_text ?? '',
        is_sensitive: field.is_sensitive ?? false,
        sort_order: Number(field.sort_order ?? productFields.length + 1),
        is_active: field.is_active ?? true,
        is_demo: field.is_demo ?? false,
      };

      setProductFields((prev) => {
        const exists = prev.some((x) => x.id === id);
        return exists ? prev.map((x) => (x.id === id ? record : x)) : [...prev, record];
      });

      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('product_fields').upsert(record);
      }
      await appendAuditLog('UPSERT_PRODUCT_FIELD', 'product_fields', id, {
        label: record.label,
        field_type: record.field_type,
      });
    },
    [ensureAdminPermission, productFields.length, connectionMode, appendAuditLog]
  );

  const deleteProductField = useCallback(
    async (id: string) => {
      ensureAdminPermission();
      setProductFields((prev) => prev.filter((x) => x.id !== id));
      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('product_fields').delete().eq('id', id);
      }
      await appendAuditLog('DELETE_PRODUCT_FIELD', 'product_fields', id, {});
    },
    [ensureAdminPermission, connectionMode, appendAuditLog]
  );

  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      status: OrderStatus,
      note: string,
      internalNote?: string,
      isPaid?: boolean
    ) => {
      ensureAdminPermission();
      const nowIso = new Date().toISOString();
      const historyEntry = {
        id: `osh-${Date.now()}`,
        order_id: orderId,
        status,
        note: note.trim() || `อัปเดตสถานะเป็น ${status}`,
        changed_by: currentUser?.id ?? null,
        changed_by_name: currentUser?.full_name ?? 'Admin',
        created_at: nowIso,
      };

      if (supabase && connectionMode === 'supabase_connected') {
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status,
            ...(internalNote !== undefined ? { internal_note: internalNote } : {}),
            ...(isPaid !== undefined ? { is_paid: isPaid } : {}),
            updated_at: nowIso,
          })
          .eq('id', orderId);
        if (updateError) {
          throw new Error(`อัปเดตสถานะออเดอร์ไม่สำเร็จ: ${updateError.message}`);
        }

        const { error: historyError } = await supabase.from('order_status_history').insert(historyEntry);
        if (historyError) {
          throw new Error(`บันทึกประวัติสถานะไม่สำเร็จ: ${historyError.message}`);
        }
      }

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            status,
            internal_note: internalNote !== undefined ? internalNote : o.internal_note,
            is_paid: isPaid !== undefined ? isPaid : o.is_paid,
            updated_at: nowIso,
            history: [...o.history, historyEntry],
          };
        })
      );

      await appendAuditLog('UPDATE_ORDER_STATUS', 'orders', orderId, {
        status,
        note,
        is_paid: isPaid,
      });
    },
    [ensureAdminPermission, currentUser, connectionMode, appendAuditLog]
  );

  const upsertPromotion = useCallback(
    async (promo: Partial<Promotion> & { code: string; title: string }) => {
      ensureAdminPermission();
      const id = promo.id ?? `prm-${Date.now()}`;
      const record: Promotion = {
        id,
        code: promo.code.trim().toUpperCase(),
        title: promo.title.trim(),
        description: promo.description ?? '',
        discount_type: promo.discount_type ?? 'fixed',
        discount_value: Math.max(0, Number(promo.discount_value ?? 0)),
        min_order_amount: Math.max(0, Number(promo.min_order_amount ?? 0)),
        max_discount_amount:
          promo.max_discount_amount !== null && promo.max_discount_amount !== undefined
            ? Number(promo.max_discount_amount)
            : null,
        used_count: promo.used_count ?? 0,
        is_active: promo.is_active ?? true,
        is_demo: promo.is_demo ?? false,
        created_at: promo.created_at ?? new Date().toISOString(),
      };

      setPromotions((prev) => {
        const exists = prev.some((x) => x.id === id);
        return exists ? prev.map((x) => (x.id === id ? record : x)) : [record, ...prev];
      });

      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('promotions').upsert(record);
      }
      await appendAuditLog('UPSERT_PROMOTION', 'promotions', id, { code: record.code });
    },
    [ensureAdminPermission, connectionMode, appendAuditLog]
  );

  const deletePromotion = useCallback(
    async (id: string) => {
      ensureAdminPermission();
      setPromotions((prev) => prev.filter((x) => x.id !== id));
      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('promotions').delete().eq('id', id);
      }
      await appendAuditLog('DELETE_PROMOTION', 'promotions', id, {});
    },
    [ensureAdminPermission, connectionMode, appendAuditLog]
  );

  const toggleReviewPublished = useCallback(
    async (reviewId: string, isPublished: boolean) => {
      ensureAdminPermission();
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, is_published: isPublished } : r))
      );
      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('reviews').update({ is_published: isPublished }).eq('id', reviewId);
      }
      await appendAuditLog('TOGGLE_REVIEW_VISIBILITY', 'reviews', reviewId, {
        is_published: isPublished,
      });
    },
    [ensureAdminPermission, connectionMode, appendAuditLog]
  );

  const deleteReview = useCallback(
    async (reviewId: string) => {
      ensureAdminPermission();
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('reviews').delete().eq('id', reviewId);
      }
      await appendAuditLog('DELETE_REVIEW', 'reviews', reviewId, {});
    },
    [ensureAdminPermission, connectionMode, appendAuditLog]
  );

  const updateSiteSettingsKey = useCallback(
    async <K extends keyof SiteSettingsBundle>(key: K, value: SiteSettingsBundle[K]) => {
      ensureAdminPermission();
      setSiteSettings((prev) => ({
        ...prev,
        [key]: value,
      }));

      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('site_settings').upsert({
          setting_key: key,
          setting_group: key === 'branding' ? 'appearance' : 'content',
          setting_value: value,
          is_public: true,
          is_demo: false,
          updated_by: currentUser?.id ?? null,
          updated_at: new Date().toISOString(),
        });
      }
      await appendAuditLog('UPDATE_SITE_SETTINGS', 'site_settings', String(key), {});
    },
    [ensureAdminPermission, connectionMode, currentUser, appendAuditLog]
  );

  const updateUserRole = useCallback(
    async (userId: string, newRole: UserRole) => {
      ensureAdminPermission();
      setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p)));
      setUserRoles((prev) => {
        const exists = prev.some((r) => r.user_id === userId);
        if (exists) {
          return prev.map((r) => (r.user_id === userId ? { ...r, role: newRole } : r));
        }
        return [
          ...prev,
          { id: `ur-${Date.now()}`, user_id: userId, role: newRole, created_at: new Date().toISOString() },
        ];
      });

      if (supabase && connectionMode === 'supabase_connected') {
        await supabase.from('user_roles').upsert({
          user_id: userId,
          role: newRole,
          granted_by: currentUser?.id ?? null,
          updated_at: new Date().toISOString(),
        });
      }
      await appendAuditLog('UPDATE_USER_ROLE', 'user_roles', userId, { role: newRole });
    },
    [ensureAdminPermission, connectionMode, currentUser, appendAuditLog]
  );

  const clearDemoRecords = useCallback(async () => {
    ensureAdminPermission();
    setOrders((prev) => prev.filter((o) => !o.is_demo));
    setReviews((prev) => prev.filter((r) => !r.is_demo));
    if (supabase && connectionMode === 'supabase_connected') {
      await Promise.all([
        supabase.from('orders').delete().eq('is_demo', true),
        supabase.from('reviews').delete().eq('is_demo', true),
      ]);
    }
    await appendAuditLog('CLEAR_DEMO_ORDERS_AND_REVIEWS', 'system', 'demo-cleanup', {});
  }, [ensureAdminPermission, connectionMode, appendAuditLog]);

  const restoreDemoRecords = useCallback(async () => {
    ensureAdminPermission();
    setOrders((prev) => {
      const realOnly = prev.filter((o) => !o.is_demo);
      return [...realOnly, ...DEMO_ORDERS];
    });
    setReviews((prev) => {
      const realOnly = prev.filter((r) => !r.is_demo);
      return [...realOnly, ...DEMO_REVIEWS];
    });
    await appendAuditLog('RESTORE_DEMO_ORDERS_AND_REVIEWS', 'system', 'demo-restore', {});
  }, [ensureAdminPermission, appendAuditLog]);

  return (
    <StoreContext.Provider
      value={{
        connectionMode,
        connectionMessage,
        isLoading,
        refreshAllData,
        currentUser,
        isAdmin,
        loginWithEmail,
        registerWithEmail,
        logout,
        updateCurrentUserProfile,
        switchDemoPersona,
        categoryGroups,
        signCategories,
        signStyles,
        signTemplates,
        decorationColors,
        decorationCategories,
        decorations,
        productFields,
        promotions,
        reviews,
        orders,
        favorites,
        siteSettings,
        profiles,
        userRoles,
        auditLogs,
        toggleFavorite,
        submitOrder,
        trackOrderSecure,
        submitCustomerReview,
        upsertCategoryGroup,
        deleteCategoryGroup,
        upsertSignCategory,
        deleteSignCategory,
        upsertSignStyle,
        upsertSignTemplate,
        deleteSignTemplate,
        upsertDecorationColor,
        deleteDecorationColor,
        upsertDecorationCategory,
        deleteDecorationCategory,
        upsertDecoration,
        deleteDecoration,
        upsertProductField,
        deleteProductField,
        updateOrderStatus,
        upsertPromotion,
        deletePromotion,
        toggleReviewPublished,
        deleteReview,
        updateSiteSettingsKey,
        updateUserRole,
        clearDemoRecords,
        restoreDemoRecords,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
