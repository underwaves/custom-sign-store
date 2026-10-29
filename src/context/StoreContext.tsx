import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isFirebaseConfigured, auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore';
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

export type DatabaseConnectionMode =
  | 'firebase_connected'
  | 'firebase_error'
  | 'awaiting_firebase_config'
  | 'supabase_connected'
  | 'supabase_error'
  | 'awaiting_supabase_config';

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
  seedFirebaseDatabase?: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const STORAGE_ORDERS_KEY = 'custom_sign_studio_orders_v2';
const STORAGE_USER_KEY = 'custom_sign_studio_user_v2';

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
    isFirebaseConfigured ? 'firebase_connected' : 'awaiting_firebase_config'
  );
  const [connectionMessage, setConnectionMessage] = useState<string>(
    isFirebaseConfigured
      ? 'กำลังเชื่อมต่อฐานข้อมูล Google Firebase Firestore...'
      : 'ยังไม่ได้ตั้งค่า VITE_FIREBASE_* ในไฟล์ .env.local — ขณะนี้แสดงข้อมูลเริ่มต้น (Placeholder & Demo) เพื่อให้ทดสอบระบบได้ครบทุกฟีเจอร์'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
  const [orders, setOrders] = useState<OrderRecord[]>(() =>
    isFirebaseConfigured ? [] : loadInitialOrders()
  );
  const [favorites, setFavorites] = useState<string[]>([
    '40000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000011',
  ]);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsBundle>(DEMO_SITE_SETTINGS);
  const [profiles, setProfiles] = useState<Profile[]>(DEMO_PROFILES);
  const [userRoles, setUserRoles] = useState<UserRoleRecord[]>(DEMO_USER_ROLES);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(DEMO_AUDIT_LOGS);
  const [processedIdempotencyKeys, setProcessedIdempotencyKeys] = useState<Record<string, OrderRecord>>({});

  useEffect(() => {
    try {
      if (isFirebaseConfigured || connectionMode === 'firebase_connected') {
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

      if (db && isFirebaseConfigured && currentUser) {
        try {
          await setDoc(doc(db, 'audit_logs', entry.id), entry);
        } catch (e) {
          console.error('Audit log write error:', e);
        }
      }
    },
    [currentUser]
  );

  // Helper: Seed demo catalog into Firestore
  const seedFirebaseDatabase = useCallback(async () => {
    if (!db) return;
    const firestore = db;
    setIsLoading(true);
    try {
      // Batch 1: groups, categories, styles
      const b1 = writeBatch(firestore);
      DEMO_CATEGORY_GROUPS.forEach((g) => b1.set(doc(firestore, 'category_groups', g.id), g));
      DEMO_SIGN_CATEGORIES.forEach((c) => b1.set(doc(firestore, 'sign_categories', c.id), c));
      DEMO_SIGN_STYLES.forEach((s) => b1.set(doc(firestore, 'sign_styles', s.id), s));
      await b1.commit();

      // Batch 2: templates
      const b2 = writeBatch(firestore);
      DEMO_SIGN_TEMPLATES.forEach((t) => b2.set(doc(firestore, 'sign_templates', t.id), t));
      await b2.commit();

      // Batch 3: colors & decoration categories
      const b3 = writeBatch(firestore);
      DEMO_DECORATION_COLORS.forEach((col) => b3.set(doc(firestore, 'decoration_colors', col.id), col));
      DEMO_DECORATION_CATEGORIES.forEach((dc) => b3.set(doc(firestore, 'decoration_categories', dc.id), dc));
      await b3.commit();

      // Batch 4: decorations & fields
      const b4 = writeBatch(firestore);
      DEMO_DECORATIONS.forEach((d) => b4.set(doc(firestore, 'decorations', d.id), d));
      DEMO_PRODUCT_FIELDS.forEach((f) => b4.set(doc(firestore, 'product_fields', f.id), f));
      await b4.commit();

      // Batch 5: promotions, reviews, site_settings
      const b5 = writeBatch(firestore);
      DEMO_PROMOTIONS.forEach((p) => b5.set(doc(firestore, 'promotions', p.id), p));
      DEMO_REVIEWS.forEach((r) => b5.set(doc(firestore, 'reviews', r.id), r));
      Object.entries(DEMO_SITE_SETTINGS).forEach(([key, val]) => {
        b5.set(doc(firestore, 'site_settings', key), {
          setting_key: key,
          setting_value: val,
          updated_at: new Date().toISOString(),
        });
      });
      await b5.commit();
      console.log('Successfully seeded initial data to Firestore!');
    } catch (err) {
      console.error('Failed to seed Firestore:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch live data from Firebase Firestore
  const refreshAllData = useCallback(async () => {
    if (!isFirebaseConfigured || !db) {
      setConnectionMode('awaiting_firebase_config');
      return;
    }

    setIsLoading(true);
    try {
      const [
        groupsSnap,
        catsSnap,
        stylesSnap,
        tplsSnap,
        colorsSnap,
        decCatsSnap,
        decsSnap,
        fieldsSnap,
        promosSnap,
        reviewsSnap,
        settingsSnap,
      ] = await Promise.all([
        getDocs(query(collection(db, 'category_groups'), orderBy('sort_order', 'asc'))),
        getDocs(query(collection(db, 'sign_categories'), orderBy('sort_order', 'asc'))),
        getDocs(query(collection(db, 'sign_styles'), orderBy('sort_order', 'asc'))),
        getDocs(query(collection(db, 'sign_templates'), orderBy('sort_order', 'asc'))),
        getDocs(query(collection(db, 'decoration_colors'), orderBy('sort_order', 'asc'))),
        getDocs(query(collection(db, 'decoration_categories'), orderBy('sort_order', 'asc'))),
        getDocs(query(collection(db, 'decorations'), orderBy('sort_order', 'asc'))),
        getDocs(query(collection(db, 'product_fields'), orderBy('sort_order', 'asc'))),
        getDocs(collection(db, 'promotions')),
        getDocs(collection(db, 'reviews')),
        getDocs(collection(db, 'site_settings')),
      ]);

      // If Firestore is completely fresh and empty, auto-seed with default catalog
      if (catsSnap.empty) {
        console.log('Fresh Firestore detected. Auto-seeding initial catalog...');
        await seedFirebaseDatabase();
        setCategoryGroups(DEMO_CATEGORY_GROUPS);
        setSignCategories(DEMO_SIGN_CATEGORIES);
        setSignStyles(DEMO_SIGN_STYLES);
        setSignTemplates(DEMO_SIGN_TEMPLATES);
        setDecorationColors(DEMO_DECORATION_COLORS);
        setDecorationCategories(DEMO_DECORATION_CATEGORIES);
        setDecorations(DEMO_DECORATIONS);
        setProductFields(DEMO_PRODUCT_FIELDS);
        setPromotions(DEMO_PROMOTIONS);
        setReviews(DEMO_REVIEWS);
        setSiteSettings(DEMO_SITE_SETTINGS);
      } else {
        if (!groupsSnap.empty) setCategoryGroups(groupsSnap.docs.map((d) => d.data() as CategoryGroup));
        if (!catsSnap.empty) setSignCategories(catsSnap.docs.map((d) => d.data() as SignCategory));
        if (!stylesSnap.empty) setSignStyles(stylesSnap.docs.map((d) => d.data() as SignStyle));
        if (!tplsSnap.empty) setSignTemplates(tplsSnap.docs.map((d) => d.data() as SignTemplate));
        if (!colorsSnap.empty) setDecorationColors(colorsSnap.docs.map((d) => d.data() as DecorationColor));
        if (!decCatsSnap.empty) setDecorationCategories(decCatsSnap.docs.map((d) => d.data() as DecorationCategory));
        if (!decsSnap.empty) setDecorations(decsSnap.docs.map((d) => d.data() as DecorationItem));
        if (!fieldsSnap.empty) setProductFields(fieldsSnap.docs.map((d) => d.data() as ProductField));
        if (!promosSnap.empty) setPromotions(promosSnap.docs.map((d) => d.data() as Promotion));
        if (!reviewsSnap.empty) setReviews(reviewsSnap.docs.map((d) => d.data() as ReviewRecord));

        if (!settingsSnap.empty) {
          const merged = { ...DEMO_SITE_SETTINGS };
          settingsSnap.docs.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.setting_key && data.setting_key in merged) {
              (merged as Record<string, unknown>)[data.setting_key] = data.setting_value;
            }
          });
          setSiteSettings(merged);
        }
      }

      // Check current logged-in user in Firebase Auth
      const firebaseUser = auth?.currentUser;
      if (firebaseUser) {
        const [profSnap, roleSnap, favSnap] = await Promise.all([
          getDoc(doc(db, 'profiles', firebaseUser.uid)),
          getDoc(doc(db, 'user_roles', firebaseUser.uid)),
          getDocs(query(collection(db, 'favorites'), where('user_id', '==', firebaseUser.uid))),
        ]);

        const profData = profSnap.exists() ? profSnap.data() : null;
        const roleData = roleSnap.exists() ? roleSnap.data() : null;
        const userRole: UserRole = (roleData?.role as UserRole) ?? 'customer';

        setCurrentUser({
          id: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          full_name: profData?.full_name ?? firebaseUser.displayName ?? 'ผู้ใช้งาน',
          phone: profData?.phone ?? '',
          contact_channel: profData?.contact_channel ?? '',
          role: userRole,
          created_at: profData?.created_at ?? new Date().toISOString(),
        });

        if (!favSnap.empty) {
          setFavorites(favSnap.docs.map((d) => d.data().template_id));
        }

        // Load orders
        const isStaffOrAdmin = ['admin', 'super_admin', 'staff'].includes(userRole);
        const orderQuery = isStaffOrAdmin
          ? query(collection(db, 'orders'), orderBy('created_at', 'desc'), limit(100))
          : query(
              collection(db, 'orders'),
              where('user_id', '==', firebaseUser.uid),
              orderBy('created_at', 'desc'),
              limit(50)
            );

        const ordersSnap = await getDocs(orderQuery);
        setOrders(ordersSnap.docs.map((d) => d.data() as OrderRecord));
      } else {
        setCurrentUser(null);
        setFavorites([]);
        setOrders([]);
      }

      setConnectionMode('firebase_connected');
      setConnectionMessage('เชื่อมต่อฐานข้อมูล Google Firebase Firestore สำเร็จ');
    } catch (err: unknown) {
      console.error('Firebase connection error:', err);
      setConnectionMode('firebase_error');
      setConnectionMessage(`เชื่อมต่อ Firebase ไม่สำเร็จ: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [seedFirebaseDatabase]);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && db) {
        try {
          const [profSnap, roleSnap] = await Promise.all([
            getDoc(doc(db, 'profiles', firebaseUser.uid)),
            getDoc(doc(db, 'user_roles', firebaseUser.uid)),
          ]);
          const profData = profSnap.exists() ? profSnap.data() : null;
          const roleData = roleSnap.exists() ? roleSnap.data() : null;
          const uRole: UserRole = (roleData?.role as UserRole) ?? 'customer';

          setCurrentUser({
            id: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            full_name: profData?.full_name ?? firebaseUser.displayName ?? 'ผู้ใช้งาน',
            phone: profData?.phone ?? '',
            contact_channel: profData?.contact_channel ?? '',
            role: uRole,
            created_at: profData?.created_at ?? new Date().toISOString(),
          });
        } catch (e) {
          console.error('Failed to resolve Firebase profile:', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Initial load
  useEffect(() => {
    if (isFirebaseConfigured) {
      refreshAllData();
    }
  }, [refreshAllData]);

  // Auth Functions
  const loginWithEmail = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      const cleanEmail = email.trim().toLowerCase();
      if (isFirebaseConfigured && auth && db) {
        try {
          const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
          const [profSnap, roleSnap] = await Promise.all([
            getDoc(doc(db, 'profiles', cred.user.uid)),
            getDoc(doc(db, 'user_roles', cred.user.uid)),
          ]);
          const profData = profSnap.exists() ? profSnap.data() : null;
          const roleData = roleSnap.exists() ? roleSnap.data() : null;
          const uRole: UserRole = (roleData?.role as UserRole) ?? 'customer';

          const userProfile: Profile = {
            id: cred.user.uid,
            email: cred.user.email ?? cleanEmail,
            full_name: profData?.full_name ?? cred.user.displayName ?? 'ผู้ใช้งาน',
            phone: profData?.phone ?? '',
            contact_channel: profData?.contact_channel ?? '',
            role: uRole,
            created_at: profData?.created_at ?? new Date().toISOString(),
          };
          setCurrentUser(userProfile);
          await refreshAllData();
          return {};
        } catch (err: unknown) {
          return { error: `เข้าสู่ระบบไม่สำเร็จ: ${(err as Error).message}` };
        }
      }

      // Demo fallback mode
      const found = profiles.find((p) => p.email.toLowerCase() === cleanEmail);
      if (found) {
        setCurrentUser(found);
        return {};
      }
      return { error: 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบจำลอง (คุณสามารถใช้บัญชี Demo ในหน้าร้านได้ทันที)' };
    },
    [profiles, refreshAllData]
  );

  const registerWithEmail = useCallback(
    async (params: {
      email: string;
      password: string;
      full_name: string;
      phone: string;
      contact_channel: string;
    }): Promise<{ error?: string }> => {
      const cleanEmail = params.email.trim().toLowerCase();
      if (isFirebaseConfigured && auth && db) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, cleanEmail, params.password);
          const uid = cred.user.uid;
          const nowIso = new Date().toISOString();

          // Check if this is the first user ever registered: if so, grant super_admin!
          const rolesSnap = await getDocs(collection(db, 'user_roles'));
          const isFirstUser = rolesSnap.empty;
          const assignedRole: UserRole = isFirstUser ? 'super_admin' : 'customer';

          const newProfile: Profile = {
            id: uid,
            email: cleanEmail,
            full_name: params.full_name.trim(),
            phone: params.phone.trim(),
            contact_channel: params.contact_channel.trim(),
            role: assignedRole,
            created_at: nowIso,
          };

          await Promise.all([
            setDoc(doc(db, 'profiles', uid), newProfile),
            setDoc(doc(db, 'user_roles', uid), {
              id: `ur-${uid}`,
              user_id: uid,
              role: assignedRole,
              created_at: nowIso,
            }),
          ]);

          setCurrentUser(newProfile);
          await refreshAllData();
          return {};
        } catch (err: unknown) {
          return { error: `ลงทะเบียนไม่สำเร็จ: ${(err as Error).message}` };
        }
      }

      // Demo fallback mode
      const newProf: Profile = {
        id: `usr-${Date.now()}`,
        email: cleanEmail,
        full_name: params.full_name.trim(),
        phone: params.phone.trim(),
        contact_channel: params.contact_channel.trim(),
        role: 'customer',
        created_at: new Date().toISOString(),
      };
      setProfiles((prev) => [...prev, newProf]);
      setCurrentUser(newProf);
      return {};
    },
    [refreshAllData]
  );

  const logout = useCallback(async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
    setCurrentUser(null);
    setOrders([]);
    localStorage.removeItem(STORAGE_ORDERS_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
  }, []);

  const updateCurrentUserProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!currentUser) return;
      const updated = { ...currentUser, ...updates, updated_at: new Date().toISOString() };
      setCurrentUser(updated);
      setProfiles((prev) => prev.map((p) => (p.id === currentUser.id ? updated : p)));

      if (isFirebaseConfigured && db) {
        await updateDoc(doc(db, 'profiles', currentUser.id), {
          full_name: updated.full_name,
          phone: updated.phone,
          contact_channel: updated.contact_channel,
          updated_at: updated.updated_at,
        });
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

      if (isFirebaseConfigured && db && currentUser) {
        const favDocId = `${currentUser.id}_${templateId}`;
        if (exists) {
          await deleteDoc(doc(db, 'favorites', favDocId));
        } else {
          await setDoc(doc(db, 'favorites', favDocId), {
            id: favDocId,
            user_id: currentUser.id,
            template_id: templateId,
            created_at: new Date().toISOString(),
          });
        }
      }
    },
    [favorites, currentUser]
  );

  // Order snapshot record builder
  function buildSnapshotOrderRecord(params: {
    orderId: string;
    orderNumber: string;
    trackingToken: string;
    input: SubmitOrderInput;
    pricing: ReturnType<typeof calculateOrderPricing>;
  }): OrderRecord {
    const { orderId, orderNumber, trackingToken, input, pricing } = params;
    const nowIso = new Date().toISOString();

    const snapshotItems: OrderItemRecord[] = input.items.map((draft) => {
      const cat = signCategories.find((c) => c.id === draft.sign_category_id);
      const style = signStyles.find((s) => s.id === draft.style_id);
      const tpl = signTemplates.find((t) => t.id === draft.template_id);

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

      const snapshotDecorations: OrderItemDecorationSnapshot[] = [];
      for (const decId of draft.decoration_ids) {
        const dec = decorations.find((d) => d.id === decId);
        if (!dec) continue;
        const color = decorationColors.find((c) => c.id === dec.color_id);
        const dCat = decorationCategories.find((catItem) => catItem.id === dec.category_id);
        snapshotDecorations.push({
          id: `oid-${Date.now()}-${dec.id}`,
          decoration_id: dec.id,
          snapshot_decoration_code: dec.code,
          snapshot_decoration_name: dec.name,
          snapshot_image_url: dec.image_url,
          snapshot_color_name: color?.name ?? '',
          snapshot_category_name: dCat?.name ?? '',
          snapshot_price: 0,
        });
      }

      return {
        id: `oi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order_id: orderId,
        sign_category_id: draft.sign_category_id,
        style_id: draft.style_id,
        template_id: draft.template_id,
        snapshot_sign_type_name: cat?.name ?? 'ป้ายสั่งทำพิเศษ',
        snapshot_style_name: style?.name ?? 'Minimal',
        snapshot_template_code: tpl?.code ?? 'TPL-001',
        snapshot_template_name: tpl?.name ?? 'เทมเพลตต้นแบบ',
        snapshot_template_image: tpl?.preview_image_url ?? '/placeholders/templates/tpl-min-01.svg',
        snapshot_base_price: cat?.base_price ?? 59,
        snapshot_style_price: style?.price_modifier ?? 0,
        snapshot_addon_price: 0,
        snapshot_decorations_price: 0,
        item_total_price: (cat?.base_price ?? 59) + (style?.price_modifier ?? 0),
        quantity: draft.quantity,
        item_note: draft.item_note ?? '',
        fields: snapshotFields,
        decorations: snapshotDecorations,
      };
    });

    const contactLookup = input.customer_contact.replace(/\D/g, '');

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
      contact_lookup_key: contactLookup,
      tracking_access_token: trackingToken,
      status: 'pending_review',
      subtotal_amount: pricing.subtotal,
      discount_amount: pricing.discount_amount,
      service_fee: pricing.service_fee,
      total_amount: pricing.grand_total,
      promotion_code: pricing.applied_promotion?.code ?? null,
      is_paid: false,
      idempotency_key: input.idempotency_key,
      is_demo: false,
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

  // Transactional Order Submission
  const submitOrder = useCallback(
    async (input: SubmitOrderInput): Promise<OrderRecord> => {
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

      // Authoritative pricing
      const pricing = calculateOrderPricing({
        draftItems: input.items,
        categories: signCategories,
        styles: signStyles,
        templates: signTemplates,
        promotions,
        promotionCode: input.promotion_code,
        serviceFee: siteSettings.contact_footer.service_fee ?? 0,
      });

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

      // Save to Firebase Firestore
      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'orders', createdOrder.id), createdOrder);

        // If promo used, increment used_count in Firestore
        if (pricing.applied_promotion) {
          try {
            await updateDoc(doc(db, 'promotions', pricing.applied_promotion.id), {
              used_count: pricing.applied_promotion.used_count + 1,
            });
          } catch (e) {
            console.error('Failed to update promo count:', e);
          }
        }

        await appendAuditLog('SUBMIT_ORDER', 'orders', createdOrder.id, {
          order_number: createdOrder.order_number,
          total_amount: createdOrder.total_amount,
        });
      }

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
      promotions,
      siteSettings.contact_footer.service_fee,
      appendAuditLog,
    ]
  );

  // Secure Order Tracking
  const trackOrderSecure = useCallback(
    async (orderNumber: string, trackingToken?: string): Promise<TrackedOrderRecord | null> => {
      const cleanOrderNo = orderNumber.trim().toUpperCase();
      const cleanToken = trackingToken ? trackingToken.trim().toLowerCase() : '';

      if (!cleanOrderNo) {
        throw new Error('กรุณาระบุหมายเลขออเดอร์ให้ถูกต้อง');
      }

      let found: OrderRecord | undefined;

      if (isFirebaseConfigured && db) {
        const q = query(collection(db, 'orders'), where('order_number', '==', cleanOrderNo), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          found = snap.docs[0].data() as OrderRecord;
        }
      }

      if (!found) {
        found = orders.find((o) => o.order_number.toUpperCase() === cleanOrderNo);
      }

      if (!found) return null;

      const isOwner = currentUser && found.user_id && found.user_id === currentUser.id;
      const isAdminOrStaff = currentUser?.role && ['admin', 'super_admin', 'staff'].includes(currentUser.role);
      const isTokenValid = cleanToken && found.tracking_access_token.toLowerCase() === cleanToken;

      if (!isOwner && !isAdminOrStaff && !isTokenValid) {
        return null;
      }

      return {
        ...found,
        items: found.items.map((item) => ({
          ...item,
          fields: item.fields.map((f) => ({
            ...f,
            field_value: f.is_sensitive ? '*'.repeat(Math.max(4, f.field_value.length)) : f.field_value,
          })),
        })),
      };
    },
    [orders, currentUser]
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

      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'reviews', newReview.id), newReview);
      }
    },
    [currentUser]
  );

  // Admin authorization check
  const ensureAdminPermission = useCallback(() => {
    if (!isAdmin) {
      throw new Error('ไม่มีสิทธิ์เข้าถึงการจัดการระบบ: เฉพาะผู้ดูแลระบบ (Admin/Staff) เท่านั้น');
    }
  }, [isAdmin]);

  // Admin CRUD
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

      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'category_groups', id), record, { merge: true });
      }
      await appendAuditLog('UPSERT_CATEGORY_GROUP', 'category_groups', id, { name: record.name });
    },
    [ensureAdminPermission, categoryGroups.length, appendAuditLog]
  );

  const deleteCategoryGroup = useCallback(
    async (id: string) => {
      ensureAdminPermission();
      setCategoryGroups((prev) => prev.filter((x) => x.id !== id));
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, 'category_groups', id));
      }
      await appendAuditLog('DELETE_CATEGORY_GROUP', 'category_groups', id, {});
    },
    [ensureAdminPermission, appendAuditLog]
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

      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'sign_categories', id), record, { merge: true });
      }
      await appendAuditLog('UPSERT_SIGN_CATEGORY', 'sign_categories', id, {
        name: record.name,
        base_price: record.base_price,
      });
    },
    [ensureAdminPermission, categoryGroups, signCategories.length, appendAuditLog]
  );

  const deleteSignCategory = useCallback(
    async (id: string) => {
      ensureAdminPermission();
      setSignCategories((prev) => prev.filter((x) => x.id !== id));
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, 'sign_categories', id));
      }
      await appendAuditLog('DELETE_SIGN_CATEGORY', 'sign_categories', id, {});
    },
    [ensureAdminPermission, appendAuditLog]
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

      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'sign_styles', id), record, { merge: true });
      }
      await appendAuditLog('UPSERT_SIGN_STYLE', 'sign_styles', id, {
        code: record.code,
        price_modifier: record.price_modifier,
      });
    },
    [ensureAdminPermission, signStyles.length, appendAuditLog]
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

      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'sign_templates', id), record, { merge: true });
      }
      await appendAuditLog('UPSERT_SIGN_TEMPLATE', 'sign_templates', id, {
        code: record.code,
        name: record.name,
      });
    },
    [ensureAdminPermission, signTemplates.length, appendAuditLog]
  );

  const deleteSignTemplate = useCallback(
    async (id: string) => {
      ensureAdminPermission();
      setSignTemplates((prev) => prev.filter((x) => x.id !== id));
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, 'sign_templates', id));
      }
      await appendAuditLog('DELETE_SIGN_TEMPLATE', 'sign_templates', id, {});
    },
    [ensureAdminPermission, appendAuditLog]
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

      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'decoration_colors', id), record, { merge: true });
      }
      await appendAuditLog('UPSERT_DECORATION_COLOR', 'decoration_colors', id, { name: record.name });
    },
    [ensureAdminPermission, decorationColors.length, appendAuditLog]
  );

  const deleteDecorationColor = useCallback(
    async (id: string) => {
      ensureAdminPermission();
      setDecorationColors((prev) => prev.filter((x) => x.id !== id));
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, 'decoration_colors', id));
      }
      await appendAuditLog('DELETE_DECORATION_COLOR', 'decoration_colors', id, {});
    },
    [ensureAdminPermission, appendAuditLog]
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

      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'decoration_categories', id), record, { merge: true });
      }
      await appendAuditLog('UPSERT_DECORATION_CATEGORY', 'decoration_categories', id, {
        name: record.name,
      });
    },
    [ensureAdminPermission, decorationCategories.length, appendAuditLog]
  );

  const deleteDecorationCategory = useCallback(
    async (id: string) => {
      ensureAdminPermission();
      setDecorationCategories((prev) => prev.filter((x) => x.id !== id));
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, 'decoration_categories', id));
      }
      await appendAuditLog('DELETE_DECORATION_CATEGORY', 'decoration_categories', id, {});
    },
    [ensureAdminPermission, appendAuditLog]
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

      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'decorations', id), record, { merge: true });
      }
      await appendAuditLog('UPSERT_DECORATION', 'decorations', id, {
        code: record.code,
        name: record.name,
      });
    },
    [ensureAdminPermission, decorations.length, appendAuditLog]
  );

  const deleteDecoration = useCallback(
    async (id: string) => {
      ensureAdminPermission();
      setDecorations((prev) => prev.filter((x) => x.id !== id));
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, 'decorations', id));
      }
      await appendAuditLog('DELETE_DECORATION', 'decorations', id, {});
    },
    [ensureAdminPermission, appendAuditLog]
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

      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'product_fields', id), record, { merge: true });
      }
      await appendAuditLog('UPSERT_PRODUCT_FIELD', 'product_fields', id, {
        label: record.label,
      });
    },
    [ensureAdminPermission, productFields.length, appendAuditLog]
  );

  const deleteProductField = useCallback(
    async (id: string) => {
      ensureAdminPermission();
      setProductFields((prev) => prev.filter((x) => x.id !== id));
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, 'product_fields', id));
      }
      await appendAuditLog('DELETE_PRODUCT_FIELD', 'product_fields', id, {});
    },
    [ensureAdminPermission, appendAuditLog]
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

      if (isFirebaseConfigured && db) {
        const orderRef = doc(db, 'orders', orderId);
        const snap = await getDoc(orderRef);
        if (snap.exists()) {
          const currentData = snap.data() as OrderRecord;
          await updateDoc(orderRef, {
            status,
            ...(internalNote !== undefined ? { internal_note: internalNote } : {}),
            ...(isPaid !== undefined ? { is_paid: isPaid } : {}),
            updated_at: nowIso,
            history: [...(currentData.history || []), historyEntry],
          });
        }
      }

      await appendAuditLog('UPDATE_ORDER_STATUS', 'orders', orderId, {
        status,
        note,
      });
    },
    [ensureAdminPermission, currentUser, appendAuditLog]
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

      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'promotions', id), record, { merge: true });
      }
      await appendAuditLog('UPSERT_PROMOTION', 'promotions', id, { code: record.code });
    },
    [ensureAdminPermission, appendAuditLog]
  );

  const deletePromotion = useCallback(
    async (id: string) => {
      ensureAdminPermission();
      setPromotions((prev) => prev.filter((x) => x.id !== id));
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, 'promotions', id));
      }
      await appendAuditLog('DELETE_PROMOTION', 'promotions', id, {});
    },
    [ensureAdminPermission, appendAuditLog]
  );

  const toggleReviewPublished = useCallback(
    async (reviewId: string, isPublished: boolean) => {
      ensureAdminPermission();
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, is_published: isPublished } : r))
      );
      if (isFirebaseConfigured && db) {
        await updateDoc(doc(db, 'reviews', reviewId), { is_published: isPublished });
      }
      await appendAuditLog('TOGGLE_REVIEW_VISIBILITY', 'reviews', reviewId, {
        is_published: isPublished,
      });
    },
    [ensureAdminPermission, appendAuditLog]
  );

  const deleteReview = useCallback(
    async (reviewId: string) => {
      ensureAdminPermission();
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, 'reviews', reviewId));
      }
      await appendAuditLog('DELETE_REVIEW', 'reviews', reviewId, {});
    },
    [ensureAdminPermission, appendAuditLog]
  );

  const updateSiteSettingsKey = useCallback(
    async <K extends keyof SiteSettingsBundle>(key: K, value: SiteSettingsBundle[K]) => {
      ensureAdminPermission();
      setSiteSettings((prev) => ({
        ...prev,
        [key]: value,
      }));

      if (isFirebaseConfigured && db) {
        await setDoc(
          doc(db, 'site_settings', String(key)),
          {
            setting_key: key,
            setting_value: value,
            updated_at: new Date().toISOString(),
          },
          { merge: true }
        );
      }
      await appendAuditLog('UPDATE_SITE_SETTINGS', 'site_settings', String(key), {});
    },
    [ensureAdminPermission, appendAuditLog]
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

      if (isFirebaseConfigured && db) {
        await setDoc(
          doc(db, 'user_roles', userId),
          {
            user_id: userId,
            role: newRole,
            updated_at: new Date().toISOString(),
          },
          { merge: true }
        );
      }
      await appendAuditLog('UPDATE_USER_ROLE', 'user_roles', userId, { role: newRole });
    },
    [ensureAdminPermission, appendAuditLog]
  );

  const clearDemoRecords = useCallback(async () => {
    ensureAdminPermission();
    setOrders((prev) => prev.filter((o) => !o.is_demo));
    setReviews((prev) => prev.filter((r) => !r.is_demo));
    await appendAuditLog('CLEAR_DEMO_ORDERS_AND_REVIEWS', 'system', 'demo-cleanup', {});
  }, [ensureAdminPermission, appendAuditLog]);

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
        seedFirebaseDatabase,
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
