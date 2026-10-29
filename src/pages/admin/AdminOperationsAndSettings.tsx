import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BadgePercent,
  CheckCircle2,
  Coins,
  Database,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/context/StoreContext';
import { uploadFileToBucket } from '@/lib/supabase';
import {
  FaqItem,
  HowToOrderStep,
  Promotion,
  ShopHighlight,
  UserRole,
} from '@/types/database';
import { formatPrice } from '@/utils/pricing';

// ============================================================================
// #12 Manage Customers (/admin/customers)
// ============================================================================
export const AdminManageCustomersPage: React.FC = () => {
  const { profiles, orders } = useStore();
  const [search, setSearch] = useState('');

  // Combine registered profiles + guest order customers
  const customerSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        full_name: string;
        email: string;
        phone: string;
        contact_channel: string;
        is_registered: boolean;
        order_count: number;
        total_spent: number;
        last_order_at: string;
      }
    >();

    profiles.forEach((p) => {
      map.set(p.email || p.id, {
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        phone: p.phone,
        contact_channel: p.contact_channel,
        is_registered: true,
        order_count: 0,
        total_spent: 0,
        last_order_at: p.created_at,
      });
    });

    orders.forEach((o) => {
      const key = o.customer_email || o.customer_contact || o.id;
      const existing = map.get(key);
      if (existing) {
        existing.order_count += 1;
        if (o.status !== 'cancelled') {
          existing.total_spent += o.total_amount;
        }
        if (new Date(o.created_at) > new Date(existing.last_order_at)) {
          existing.last_order_at = o.created_at;
        }
      } else {
        map.set(key, {
          id: o.user_id || o.id,
          full_name: o.customer_name,
          email: o.customer_email || '-',
          phone: o.customer_contact,
          contact_channel: o.delivery_channel,
          is_registered: Boolean(o.user_id),
          order_count: 1,
          total_spent: o.status !== 'cancelled' ? o.total_amount : 0,
          last_order_at: o.created_at,
        });
      }
    });

    return Array.from(map.values()).filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.contact_channel.toLowerCase().includes(q)
      );
    });
  }, [profiles, orders, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-pink-100 shadow-pastel">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            Manage Customers
          </span>
          <h1 className="text-2xl font-bold text-stone-800">
            ข้อมูลลูกค้าและประวัติการสั่งซื้อ ({customerSummaries.length} ราย)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            รวมข้อมูลสมาชิกที่ลงทะเบียนและลูกค้าที่สั่งทำป้ายพร้อมช่องทางจัดส่งงาน
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-pink-100">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อลูกค้า, อีเมล, เบอร์โทร หรือ LINE ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-pink-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-pink-50/60 text-stone-600 text-xs uppercase">
              <tr>
                <th className="px-5 py-3.5">ชื่อลูกค้า</th>
                <th className="px-5 py-3.5">ประเภทบัญชี</th>
                <th className="px-5 py-3.5">ช่องทางติดต่อ / รับไฟล์</th>
                <th className="px-5 py-3.5 text-center">จำนวนออเดอร์</th>
                <th className="px-5 py-3.5 text-right">ยอดสั่งซื้อสะสม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {customerSummaries.map((c) => (
                <tr key={c.id} className="hover:bg-pink-50/20">
                  <td className="px-5 py-4">
                    <div className="font-bold text-stone-800">{c.full_name}</div>
                    <div className="text-xs text-stone-400">{c.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        c.is_registered
                          ? 'bg-pink-50 text-pink-700'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {c.is_registered ? 'สมาชิก (Member)' : 'สั่งซื้อทั่วไป (Guest)'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-stone-600">
                    <div>ติดต่อ: {c.phone}</div>
                    <div className="text-stone-400">รับงานทาง: {c.contact_channel}</div>
                  </td>
                  <td className="px-5 py-4 text-center font-bold text-stone-700">
                    {c.order_count} ออเดอร์
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-pink-600">
                    {formatPrice(c.total_spent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// #13 Manage Pricing (/admin/pricing) — Part 13 Pricing & Snapshot Rules
// ============================================================================
export const AdminManagePricingPage: React.FC = () => {
  const {
    signCategories,
    signStyles,
    siteSettings,
    upsertSignCategory,
    upsertSignStyle,
    updateSiteSettingsKey,
  } = useStore();

  const [priceEdits, setPriceEdits] = useState<Record<string, number>>({});
  const [styleEdits, setStyleEdits] = useState<Record<string, number>>({});
  const [serviceFee, setServiceFee] = useState<number>(
    siteSettings.contact_footer.service_fee ?? 0
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCategoryPrice = async (catId: string) => {
    const cat = signCategories.find((c) => c.id === catId);
    if (!cat) return;
    const newPrice = priceEdits[catId] ?? cat.base_price;
    setIsSaving(true);
    try {
      await upsertSignCategory({
        ...cat,
        base_price: Math.max(0, Number(newPrice)),
      });
      toast.success(`อัปเดตราคาเริ่มต้นของ "${cat.name}" เป็น ${formatPrice(newPrice)} แล้ว`);
    } catch (err: any) {
      toast.error(err?.message || 'อัปเดตราคาไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStyleModifier = async (styleId: string) => {
    const style = signStyles.find((s) => s.id === styleId);
    if (!style) return;
    const newMod = styleEdits[styleId] ?? style.price_modifier;
    setIsSaving(true);
    try {
      await upsertSignStyle({
        ...style,
        price_modifier: Math.max(0, Number(newMod)),
      });
      toast.success(`อัปเดตราคาสไตล์ "${style.name}" เป็น +${formatPrice(newMod)} แล้ว`);
    } catch (err: any) {
      toast.error(err?.message || 'อัปเดตราคาไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveServiceFee = async () => {
    setIsSaving(true);
    try {
      await updateSiteSettingsKey('contact_footer', {
        ...siteSettings.contact_footer,
        service_fee: Math.max(0, Number(serviceFee)),
      });
      toast.success('บันทึกค่าบริการเพิ่มเติมเรียบร้อยแล้ว');
    } catch (err: any) {
      toast.error(err?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-pastel space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold">
          <Coins className="w-3.5 h-3.5" />
          Manage Pricing (Part 13)
        </span>
        <h1 className="text-2xl font-bold text-stone-800">จัดการโครงสร้างราคาทั้งระบบ</h1>
        <p className="text-sm text-stone-500">
          การแก้ไขราคาในหน้านี้จะมีผลเฉพาะกับ <strong>ออเดอร์ใหม่เท่านั้น</strong> โดยออเดอร์เก่าที่ยืนยันแล้วจะยังคงใช้ราคา Snapshot เดิมในตาราง <code>order_items</code> เสมอ
        </p>
      </div>

      {/* Style Modifiers & Free Decoration Guarantee */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-pink-100 space-y-4">
          <h2 className="font-bold text-stone-800 text-base">
            1. ราคาเพิ่มตามสไตล์ป้าย (Style Price Modifiers)
          </h2>
          <div className="space-y-3">
            {signStyles.map((style) => {
              const val = styleEdits[style.id] ?? style.price_modifier;
              return (
                <div
                  key={style.id}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-stone-800 text-sm">{style.name}</div>
                    <div className="text-xs text-stone-500">รหัส: {style.code}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500">+</span>
                    <input
                      type="number"
                      min={0}
                      value={val}
                      onChange={(e) =>
                        setStyleEdits({ ...styleEdits, [style.id]: Number(e.target.value) })
                      }
                      className="w-24 px-3 py-1.5 rounded-xl border border-stone-200 text-sm font-bold text-right"
                    />
                    <span className="text-xs text-stone-500">฿</span>
                    <button
                      disabled={isSaving}
                      onClick={() => handleSaveStyleModifier(style.id)}
                      className="px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold"
                    >
                      บันทึก
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-pink-100 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="font-bold text-stone-800 text-base">
              2. ราคาของตกแต่ง และค่าบริการเพิ่มเติม
            </h2>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-emerald-900 text-sm">
                  คลังของตกแต่งทุกชิ้น (Decorations)
                </div>
                <div className="text-xs text-emerald-700">
                  ลูกค้าเลือกของตกแต่งได้ไม่จำกัดโดยไม่บวกราคาเพิ่ม
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">
                ฟรี 0 บาทเสมอ
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-stone-800 text-sm">
                  ค่าบริการเพิ่มเติมต่อออเดอร์ (Service Fee)
                </div>
                <div className="text-xs text-stone-500">ค่าเริ่มต้น 0 บาท (ตั้งเพิ่มได้หากต้องการ)</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={serviceFee}
                  onChange={(e) => setServiceFee(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 rounded-xl border border-stone-200 text-sm font-bold text-right"
                />
                <span className="text-xs text-stone-500">฿</span>
                <button
                  disabled={isSaving}
                  onClick={handleSaveServiceFee}
                  className="px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Base Price per Sign Category */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 space-y-4">
        <h2 className="font-bold text-stone-800 text-base">
          3. ราคาเริ่มต้นของป้ายแต่ละประเภท (Sign Type Base Prices)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...signCategories]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((cat) => {
              const currentVal = priceEdits[cat.id] ?? cat.base_price;
              return (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-2xl border border-stone-100 bg-stone-50/60 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-stone-800 text-xs truncate">{cat.name}</div>
                    <div className="text-[11px] text-stone-400">{cat.group_name}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={0}
                      value={currentVal}
                      onChange={(e) =>
                        setPriceEdits({ ...priceEdits, [cat.id]: Number(e.target.value) })
                      }
                      className="w-20 px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-right bg-white"
                    />
                    <span className="text-xs text-stone-500">฿</span>
                    <button
                      disabled={isSaving}
                      onClick={() => handleSaveCategoryPrice(cat.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold"
                    >
                      บันทึก
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// #14 Manage Promotions (/admin/promotions)
// ============================================================================
export const AdminManagePromotionsPage: React.FC = () => {
  const { promotions, upsertPromotion, deletePromotion } = useStore();
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setEditingPromo({
      code: '',
      title: '',
      description: '',
      discount_type: 'fixed',
      discount_value: 20,
      min_order_amount: 150,
      max_discount_amount: null,
      used_count: 0,
      is_active: true,
      is_demo: false,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo?.code?.trim() || !editingPromo?.title?.trim()) {
      toast.error('กรุณากรอกรหัสคูปองและชื่อโปรโมชั่น');
      return;
    }
    setIsSaving(true);
    try {
      await upsertPromotion({
        ...editingPromo,
        code: editingPromo.code.trim().toUpperCase(),
        title: editingPromo.title.trim(),
        discount_value: Math.max(0, Number(editingPromo.discount_value ?? 0)),
        min_order_amount: Math.max(0, Number(editingPromo.min_order_amount ?? 0)),
      });
      toast.success('บันทึกโปรโมชั่นเรียบร้อยแล้ว');
      setEditingPromo(null);
    } catch (err: any) {
      toast.error(err?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (promo: Promotion) => {
    if (!window.confirm(`ยืนยันการลบโปรโมชั่น "${promo.code}"?`)) return;
    try {
      await deletePromotion(promo.id);
      toast.success('ลบโปรโมชั่นเรียบร้อยแล้ว');
    } catch (err: any) {
      toast.error(err?.message || 'ลบไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-pink-100 shadow-pastel">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold mb-2">
            <BadgePercent className="w-3.5 h-3.5" />
            Manage Promotions
          </span>
          <h1 className="text-2xl font-bold text-stone-800">
            จัดการโค้ดส่วนลดและโปรโมชั่น ({promotions.length} รายการ)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            สร้างโค้ดส่วนลดแบบจำนวนเงิน (บาท) หรือแบบเปอร์เซ็นต์ (%) พร้อมกำหนดยอดสั่งซื้อขั้นต่ำ
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          สร้างโค้ดส่วนลดใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className="bg-white rounded-3xl border border-pink-100 p-5 shadow-xs flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-xl bg-pink-500 text-white font-mono font-bold text-sm">
                  {promo.code}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    promo.is_active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {promo.is_active ? 'ใช้งานได้' : 'ปิดใช้งาน'}
                </span>
              </div>
              <h3 className="font-bold text-stone-800 text-base pt-1">{promo.title}</h3>
              <p className="text-xs text-stone-500">{promo.description}</p>
              <div className="pt-2 text-xs text-stone-600 space-y-1">
                <div>
                  มูลค่าส่วนลด:{' '}
                  <strong className="text-pink-600">
                    {promo.discount_type === 'fixed'
                      ? formatPrice(promo.discount_value)
                      : `${promo.discount_value}%`}
                  </strong>
                </div>
                <div>ขั้นต่ำการสั่งซื้อ: {formatPrice(promo.min_order_amount)}</div>
                <div>ถูกใช้งานแล้ว: {promo.used_count} ครั้ง</div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
              <button
                onClick={() => setEditingPromo(promo)}
                className="px-3 py-1.5 rounded-xl bg-pink-50 text-pink-700 text-xs font-semibold hover:bg-pink-100"
              >
                แก้ไข
              </button>
              <button
                onClick={() => handleDelete(promo)}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100"
              >
                ลบ
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingPromo && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-pink-100 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-lg text-stone-800">
                {editingPromo.id ? 'แก้ไขโค้ดส่วนลด' : 'สร้างโค้ดส่วนลดใหม่'}
              </h3>
              <button
                onClick={() => setEditingPromo(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    รหัสคูปอง (Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPromo.code || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, code: e.target.value })}
                    placeholder="WELCOME10"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ประเภทส่วนลด
                  </label>
                  <select
                    value={editingPromo.discount_type || 'fixed'}
                    onChange={(e) =>
                      setEditingPromo({
                        ...editingPromo,
                        discount_type: e.target.value as 'fixed' | 'percentage',
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  >
                    <option value="fixed">ลดเป็นบาท (Fixed)</option>
                    <option value="percentage">ลดเป็น % (Percentage)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ชื่อโปรโมชั่น *
                </label>
                <input
                  type="text"
                  required
                  value={editingPromo.title || ''}
                  onChange={(e) => setEditingPromo({ ...editingPromo, title: e.target.value })}
                  placeholder="ส่วนลดต้อนรับเปิดร้านใหม่"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    มูลค่าส่วนลด *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editingPromo.discount_value ?? 10}
                    onChange={(e) =>
                      setEditingPromo({
                        ...editingPromo,
                        discount_value: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm font-bold text-pink-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ยอดสั่งซื้อขั้นต่ำ (บาท)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingPromo.min_order_amount ?? 0}
                    onChange={(e) =>
                      setEditingPromo({
                        ...editingPromo,
                        min_order_amount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  เงื่อนไข / คำอธิบาย
                </label>
                <textarea
                  rows={2}
                  value={editingPromo.description || ''}
                  onChange={(e) =>
                    setEditingPromo({ ...editingPromo, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPromo.is_active ?? true}
                  onChange={(e) =>
                    setEditingPromo({ ...editingPromo, is_active: e.target.checked })
                  }
                  className="rounded text-pink-500"
                />
                เปิดใช้งานคูปองนี้
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingPromo(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกโปรโมชั่น'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// #15 Manage Reviews (/admin/reviews)
// ============================================================================
export const AdminManageReviewsPage: React.FC = () => {
  const { reviews, toggleReviewPublished, deleteReview } = useStore();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-pastel">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold mb-2">
          <Star className="w-3.5 h-3.5" />
          Manage Reviews
        </span>
        <h1 className="text-2xl font-bold text-stone-800">
          จัดการรีวิวลูกค้า ({reviews.length} รีวิว)
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          อนุมัติหรือซ่อนรีวิวที่แสดงบนหน้าแรก และแยกแยะรีวิวตัวอย่าง (Demo) ออกจากรีวิวลูกค้าจริง
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-white rounded-3xl border border-pink-100 p-5 shadow-xs flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-800">{rev.customer_name}</span>
                  {rev.is_demo && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      รีวิวตัวอย่าง (Demo)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: rev.rating }).map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
              <div className="text-xs text-pink-600 font-medium">
                {rev.sign_type_name} • สไตล์ {rev.style_name}
              </div>
              <p className="text-sm text-stone-600">{rev.comment}</p>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  rev.is_published
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {rev.is_published ? 'แสดงบนหน้าแรก' : 'ซ่อนอยู่'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    toggleReviewPublished(rev.id, !rev.is_published);
                    toast.success(
                      !rev.is_published ? 'เปิดแสดงรีวิวบนหน้าแรกแล้ว' : 'ซ่อนรีวิวแล้ว'
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 text-pink-700 text-xs font-semibold hover:bg-pink-100"
                >
                  {rev.is_published ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> ซ่อน
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> แสดงหน้าเว็บ
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('ยืนยันการลบรีวิวนี้?')) {
                      deleteReview(rev.id);
                      toast.success('ลบรีวิวเรียบร้อยแล้ว');
                    }
                  }}
                  className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// #16 Manage Website Content (/admin/website-content) — CMS for Home & FAQ & Contact
// ============================================================================
export const AdminManageWebsiteContentPage: React.FC = () => {
  const { siteSettings, updateSiteSettingsKey } = useStore();
  const [hero, setHero] = useState(siteSettings.hero_banner);
  const [steps, setSteps] = useState<HowToOrderStep[]>(siteSettings.how_to_order);
  const [highlights, setHighlights] = useState<ShopHighlight[]>(siteSettings.highlights);
  const [faqs, setFaqs] = useState<FaqItem[]>(siteSettings.faq_list);
  const [contact, setContact] = useState(siteSettings.contact_footer);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const { url } = await uploadFileToBucket(file, 'site-assets', 'banners');
      setHero({ ...hero, banner_image_url: url });
      toast.success('อัปโหลดภาพแบนเนอร์ใหม่สำเร็จ');
    } catch (err: any) {
      toast.error(err?.message || 'อัปโหลดไม่สำเร็จ');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const saveHero = async () => {
    await updateSiteSettingsKey('hero_banner', hero);
    toast.success('บันทึกข้อมูล Hero Banner หน้าแรกเรียบร้อยแล้ว');
  };

  const saveStepsAndHighlights = async () => {
    await updateSiteSettingsKey('how_to_order', steps);
    await updateSiteSettingsKey('highlights', highlights);
    toast.success('บันทึกขั้นตอนการสั่งทำและจุดเด่นของร้านเรียบร้อยแล้ว');
  };

  const saveFaqs = async () => {
    await updateSiteSettingsKey('faq_list', faqs);
    toast.success('บันทึกคำถามที่พบบ่อย (FAQ) เรียบร้อยแล้ว');
  };

  const saveContact = async () => {
    await updateSiteSettingsKey('contact_footer', contact);
    toast.success('บันทึกข้อมูลช่องทางติดต่อและ Footer เรียบร้อยแล้ว');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-pastel">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold mb-2">
          <Globe className="w-3.5 h-3.5" />
          Manage Website Content (Part 5 & CMS)
        </span>
        <h1 className="text-2xl font-bold text-stone-800">
          จัดการเนื้อหาหน้าเว็บไซต์ (Hero Banner, วิธีสั่งซื้อ, จุดเด่น, FAQ, ติดต่อร้าน)
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          แก้ไขข้อความและรูปภาพทุกส่วนของหน้าแรกและหน้าข้อมูลร้านได้ทันทีโดยไม่ต้องแก้โค้ด
        </p>
      </div>

      {/* 1. Hero Banner */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-stone-800 text-lg">1. ส่วนแบนเนอร์หลัก (Hero Section)</h2>
          <button
            onClick={saveHero}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold"
          >
            <Save className="w-3.5 h-3.5" /> บันทึก Hero Banner
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              ข้อความป้ายกำกับด้านบน (Badge)
            </label>
            <input
              type="text"
              value={hero.badge_text}
              onChange={(e) => setHero({ ...hero, badge_text: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              ข้อความปุ่มหลัก (CTA Button)
            </label>
            <input
              type="text"
              value={hero.cta_primary_text}
              onChange={(e) => setHero({ ...hero, cta_primary_text: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              หัวข้อหลัก (Headline)
            </label>
            <input
              type="text"
              value={hero.headline}
              onChange={(e) => setHero({ ...hero, headline: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm font-bold"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              คำอธิบายรอง (Subheadline)
            </label>
            <textarea
              rows={2}
              value={hero.subheadline}
              onChange={(e) => setHero({ ...hero, subheadline: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
            />
          </div>
          <div className="md:col-span-2 p-4 rounded-2xl bg-pink-50/40 border border-pink-100 flex flex-col sm:flex-row items-center gap-4">
            <img
              src={hero.banner_image_url}
              alt="Hero Banner"
              className="w-40 h-24 rounded-xl object-cover border border-pink-200 bg-white"
            />
            <div className="flex-1 space-y-2 w-full">
              <input
                type="text"
                value={hero.banner_image_url}
                onChange={(e) => setHero({ ...hero, banner_image_url: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-pink-600 text-xs font-semibold cursor-pointer hover:bg-pink-50">
                <Upload className="w-3.5 h-3.5" />
                {isUploadingBanner ? 'กำลังอัปโหลด...' : 'อัปโหลดภาพ Hero Banner ใหม่'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 2. How to Order & Highlights */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-stone-800 text-lg">
            2. ขั้นตอนการสั่งทำป้าย & จุดเด่นของร้าน
          </h2>
          <button
            onClick={saveStepsAndHighlights}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold"
          >
            <Save className="w-3.5 h-3.5" /> บันทึกขั้นตอนและจุดเด่น
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-stone-500">วิธีสั่งทำป้าย</h3>
            {steps.map((s, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
                <input
                  type="text"
                  value={s.title}
                  onChange={(e) => {
                    const next = [...steps];
                    next[idx] = { ...s, title: e.target.value };
                    setSteps(next);
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold bg-white"
                />
                <input
                  type="text"
                  value={s.description}
                  onChange={(e) => {
                    const next = [...steps];
                    next[idx] = { ...s, description: e.target.value };
                    setSteps(next);
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white"
                />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-stone-500">จุดเด่นของร้าน</h3>
            {highlights.map((h, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
                <input
                  type="text"
                  value={h.title}
                  onChange={(e) => {
                    const next = [...highlights];
                    next[idx] = { ...h, title: e.target.value };
                    setHighlights(next);
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold bg-white"
                />
                <input
                  type="text"
                  value={h.description}
                  onChange={(e) => {
                    const next = [...highlights];
                    next[idx] = { ...h, description: e.target.value };
                    setHighlights(next);
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. FAQ */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-stone-800 text-lg">3. คำถามที่พบบ่อย (FAQ)</h2>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setFaqs([...faqs, { question: 'คำถามใหม่?', answer: 'คำตอบ...' }])
              }
              className="px-3 py-2 rounded-xl bg-pink-50 text-pink-700 text-xs font-semibold"
            >
              + เพิ่มคำถาม
            </button>
            <button
              onClick={saveFaqs}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold"
            >
              <Save className="w-3.5 h-3.5" /> บันทึก FAQ
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => {
                    const next = [...faqs];
                    next[idx] = { ...faq, question: e.target.value };
                    setFaqs(next);
                  }}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold bg-white"
                />
                <button
                  onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                rows={2}
                value={faq.answer}
                onChange={(e) => {
                  const next = [...faqs];
                  next[idx] = { ...faq, answer: e.target.value };
                  setFaqs(next);
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Contact & Footer */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-stone-800 text-lg">4. ช่องทางติดต่อร้าน & ข้อความ Footer</h2>
          <button
            onClick={saveContact}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold"
          >
            <Save className="w-3.5 h-3.5" /> บันทึกข้อมูลติดต่อ
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">LINE Official</label>
            <input
              type="text"
              value={contact.line_id}
              onChange={(e) => setContact({ ...contact, line_id: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Facebook Page</label>
            <input
              type="text"
              value={contact.facebook}
              onChange={(e) => setContact({ ...contact, facebook: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Instagram</label>
            <input
              type="text"
              value={contact.instagram}
              onChange={(e) => setContact({ ...contact, instagram: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">เบอร์โทรศัพท์</label>
            <input
              type="text"
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">อีเมลร้าน</label>
            <input
              type="text"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">เวลาทำการ</label>
            <input
              type="text"
              value={contact.working_hours}
              onChange={(e) => setContact({ ...contact, working_hours: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// #17 Manage Site Settings (/admin/site-settings) — Branding, Theme, Demo Cleanup & Supabase Guide
// ============================================================================
export const AdminManageSiteSettingsPage: React.FC = () => {
  const {
    connectionMode,
    connectionMessage,
    siteSettings,
    updateSiteSettingsKey,
    clearDemoRecords,
    restoreDemoRecords,
  } = useStore();

  const [branding, setBranding] = useState(siteSettings.branding);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const { url } = await uploadFileToBucket(file, 'site-assets', 'branding');
      setBranding({ ...branding, logo_url: url });
      toast.success('อัปโหลดโลโก้ร้านสำเร็จ');
    } catch (err: any) {
      toast.error(err?.message || 'อัปโหลดโลโก้ไม่สำเร็จ');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSiteSettingsKey('branding', branding);
    toast.success('บันทึกการตั้งค่าแบรนด์และสีธีมเว็บไซต์เรียบร้อยแล้ว');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-pastel">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold mb-2">
          <Settings className="w-3.5 h-3.5" />
          Manage Site Settings & Database Connection
        </span>
        <h1 className="text-2xl font-bold text-stone-800">
          ตั้งค่าแบรนด์ สีธีมพาสเทล และการเชื่อมต่อฐานข้อมูล Supabase
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          เปลี่ยนชื่อร้าน โลโก้ สีธีมของเว็บไซต์ จัดการข้อมูลตัวอย่าง (Demo) และตรวจสอบสถานะการเชื่อมต่อ Supabase
        </p>
      </div>

      {/* Supabase Connection Status Card */}
      <div
        className={`p-6 rounded-3xl border space-y-3 ${
          connectionMode === 'supabase_connected'
            ? 'bg-emerald-50/70 border-emerald-200'
            : 'bg-amber-50/80 border-amber-200'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <Database
              className={`w-5 h-5 ${
                connectionMode === 'supabase_connected' ? 'text-emerald-600' : 'text-amber-600'
              }`}
            />
            <h2 className="font-bold text-stone-800 text-base">
              สถานะฐานข้อมูล:{' '}
              {connectionMode === 'supabase_connected'
                ? 'เชื่อมต่อ Supabase PostgreSQL สำเร็จแล้ว (Production Live)'
                : 'โหมดเริ่มต้นรอการตั้งค่า .env.local (Sandbox & Placeholder Mode)'}
            </h2>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              connectionMode === 'supabase_connected'
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500 text-white'
            }`}
          >
            {connectionMode}
          </span>
        </div>
        <p className="text-xs text-stone-700 leading-relaxed">{connectionMessage}</p>
        <div className="p-4 rounded-2xl bg-white/90 border border-stone-200/80 text-xs text-stone-600 space-y-1.5">
          <div className="font-bold text-stone-800">
            ไฟล์ SQL Migration และ Seed Data ที่เตรียมไว้พร้อมรันใน Supabase SQL Editor:
          </div>
          <ul className="list-disc pl-5 space-y-1 font-mono text-[11px]">
            <li>supabase/migrations/20261027000001_initial_schema.sql (20 ตาราง + Indexes + Constraints)</li>
            <li>supabase/migrations/20261027000002_rls_and_storage.sql (Row Level Security + 4 Storage Buckets)</li>
            <li>supabase/migrations/20261027000003_order_rpc.sql (Transactional Order RPC & Secure Tracking)</li>
            <li>supabase/seed.sql (ข้อมูลเริ่มต้น 15 ประเภทป้าย, 2 สไตล์, 20 เทมเพลต, 30 ของตกแต่งฟรี)</li>
          </ul>
        </div>
      </div>

      {/* Branding & Theme Color Form */}
      <form
        onSubmit={handleSaveBranding}
        className="bg-white p-6 rounded-3xl border border-pink-100 space-y-5"
      >
        <h2 className="font-bold text-stone-800 text-lg">
          1. ข้อมูลชื่อร้าน โลโก้ และโทนสีพาสเทลของเว็บไซต์
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              ชื่อร้าน (Shop Name) *
            </label>
            <input
              type="text"
              required
              value={branding.shop_name}
              onChange={(e) => setBranding({ ...branding, shop_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              สโลแกนร้าน (Shop Tagline)
            </label>
            <input
              type="text"
              value={branding.shop_tagline}
              onChange={(e) => setBranding({ ...branding, shop_tagline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
            />
          </div>
        </div>

        {/* Logo Upload */}
        <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-center gap-4">
          <img
            src={branding.logo_url}
            alt="Shop Logo"
            className="w-16 h-16 rounded-2xl object-contain bg-white border border-pink-200 p-1.5"
          />
          <div className="flex-1 space-y-2">
            <label className="block text-xs font-semibold text-stone-700">
              URL โลโก้ร้าน หรืออัปโหลดไฟล์ใหม่
            </label>
            <input
              type="text"
              value={branding.logo_url}
              onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
              className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white"
            />
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-pink-600 text-xs font-semibold cursor-pointer hover:bg-pink-50">
              <Upload className="w-3.5 h-3.5" />
              {isUploadingLogo ? 'กำลังอัปโหลด...' : 'อัปโหลดโลโก้ใหม่'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleUploadLogo}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Theme Colors */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-stone-700 uppercase">
            ปรับแต่งโทนสีธีมเว็บไซต์ (Dynamic CSS Theme Variables)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(
              [
                ['brand_pink', 'สีชมพูพาสเทลหลัก'],
                ['brand_pink_dark', 'สีปุ่มเน้น (Accent)'],
                ['brand_pink_light', 'สีพื้นหลังอ่อน'],
                ['brand_cream', 'สีครีมอบอุ่น'],
                ['brand_brown', 'สีน้ำตาลข้อความ'],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className="p-3 rounded-2xl border border-stone-200 bg-stone-50 space-y-1.5"
              >
                <span className="block text-[11px] font-semibold text-stone-700">{label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.theme_colors[key]}
                    onChange={(e) =>
                      setBranding({
                        ...branding,
                        theme_colors: {
                          ...branding.theme_colors,
                          [key]: e.target.value,
                        },
                      })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300"
                  />
                  <span className="text-xs font-mono text-stone-600">
                    {branding.theme_colors[key]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
          <input
            type="checkbox"
            checked={branding.is_placeholder_data}
            onChange={(e) =>
              setBranding({ ...branding, is_placeholder_data: e.target.checked })
            }
            className="rounded text-pink-500"
          />
          แสดงแถบแจ้งเตือนในระบบหลังบ้านว่าขณะนี้ยังมีข้อมูลตัวอย่าง (Placeholder / Demo Mode)
        </label>

        <div className="flex justify-end pt-3 border-t border-stone-100">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold shadow-sm"
          >
            <Save className="w-4 h-4" />
            บันทึกการตั้งค่าแบรนด์และสีธีม
          </button>
        </div>
      </form>

      {/* Demo Data Management (Part 21) */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 space-y-4">
        <h2 className="font-bold text-stone-800 text-lg">
          2. จัดการข้อมูลตัวอย่างเริ่มต้น (Demo Orders & Demo Reviews Cleanup)
        </h2>
        <p className="text-xs text-stone-500">
          ตามข้อกำหนดส่วนที่ 21 ข้อมูลตัวอย่างจะถูกระบุสถานะ <code>is_demo = true</code> และไม่นำไปนับรวมเป็นยอดขายจริง คุณสามารถล้างออเดอร์และรีวิวตัวอย่างออกเมื่อพร้อมเปิดร้านจริง หรือกู้คืนกลับมาทดสอบได้
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={async () => {
              if (window.confirm('ยืนยันการซ่อน/ลบออเดอร์ตัวอย่างและรีวิวตัวอย่าง (Demo)?')) {
                await clearDemoRecords();
                toast.success('ล้างออเดอร์และรีวิวตัวอย่าง (Demo) เรียบร้อยแล้ว');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200"
          >
            <Trash2 className="w-4 h-4" />
            ล้างออเดอร์และรีวิวตัวอย่าง (Demo)
          </button>
          <button
            type="button"
            onClick={async () => {
              await restoreDemoRecords();
              toast.success('กู้คืนข้อมูลตัวอย่างเริ่มต้นกลับมาครบถ้วนแล้ว');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            กู้คืนข้อมูลตัวอย่าง (Restore Demo Data)
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// #18 Admin User Management (/admin/users) — Server-Side Role Assignment
// ============================================================================
export const AdminUserManagementPage: React.FC = () => {
  const { profiles, userRoles, updateUserRole } = useStore();

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success(`อัปเดตสิทธิ์ผู้ใช้งานเป็น "${newRole}" เรียบร้อยแล้ว`);
    } catch (err: any) {
      toast.error(err?.message || 'ไม่สามารถเปลี่ยนสิทธิ์ได้');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-pastel">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold mb-2">
          <Shield className="w-3.5 h-3.5" />
          Admin User Management (RBAC)
        </span>
        <h1 className="text-2xl font-bold text-stone-800">
          จัดการสิทธิ์ผู้ดูแลระบบและพนักงาน (User Roles)
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          สิทธิ์ทั้งหมดถูกตรวจสอบฝั่งเซิร์ฟเวอร์ผ่านตาราง <code>public.user_roles</code> และฟังก์ชัน <code>public.is_admin_or_staff()</code> ใน Row Level Security
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-pink-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-pink-50/60 text-stone-600 text-xs uppercase">
              <tr>
                <th className="px-5 py-3.5">ชื่อผู้ใช้</th>
                <th className="px-5 py-3.5">อีเมล</th>
                <th className="px-5 py-3.5">ช่องทางติดต่อ</th>
                <th className="px-5 py-3.5">ระดับสิทธิ์ปัจจุบัน (Role)</th>
                <th className="px-5 py-3.5 text-right">เปลี่ยนระดับสิทธิ์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {profiles.map((p) => {
                const roleRecord = userRoles.find((r) => r.user_id === p.id);
                const role: UserRole = roleRecord?.role || p.role || 'customer';
                return (
                  <tr key={p.id} className="hover:bg-pink-50/20">
                    <td className="px-5 py-4 font-bold text-stone-800">{p.full_name}</td>
                    <td className="px-5 py-4 text-xs font-mono text-stone-600">{p.email}</td>
                    <td className="px-5 py-4 text-xs text-stone-500">{p.contact_channel}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          role === 'super_admin' || role === 'admin'
                            ? 'bg-pink-500 text-white'
                            : role === 'staff'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <select
                        value={role}
                        onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 bg-white"
                      >
                        <option value="customer">customer (ลูกค้าทั่วไป)</option>
                        <option value="staff">staff (ทีมกราฟิก/แอดมินดูแลออเดอร์)</option>
                        <option value="admin">admin (ผู้ดูแลระบบ)</option>
                        <option value="super_admin">super_admin (เจ้าของร้านสูงสุด)</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// #19 Activity Logs (/admin/activity-logs) — Audit Logs
// ============================================================================
export const AdminActivityLogsPage: React.FC = () => {
  const { auditLogs } = useStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.entity_type.toLowerCase().includes(q) ||
        log.actor_email.toLowerCase().includes(q) ||
        log.entity_id.toLowerCase().includes(q)
      );
    });
  }, [auditLogs, search]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-pastel">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold mb-2">
          <Activity className="w-3.5 h-3.5" />
          Activity & Audit Logs (Part 18 & 20)
        </span>
        <h1 className="text-2xl font-bold text-stone-800">
          บันทึกประวัติการดำเนินการของผู้ดูแลระบบ (Audit Logs)
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          บันทึกทุกการแก้ไขราคา เปลี่ยนสถานะออเดอร์ จัดการเทมเพลต และเปลี่ยนการตั้งค่าระบบเพื่อความปลอดภัยและตรวจสอบย้อนหลังได้
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-pink-100">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาตาม Action, Entity Type หรืออีเมลแอดมิน..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-pink-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-pink-50/60 text-stone-600 text-xs uppercase">
              <tr>
                <th className="px-5 py-3.5">วัน-เวลา</th>
                <th className="px-5 py-3.5">ผู้ดำเนินการ</th>
                <th className="px-5 py-3.5">การกระทำ (Action)</th>
                <th className="px-5 py-3.5">ข้อมูลที่แก้ไข (Entity)</th>
                <th className="px-5 py-3.5">รายละเอียด (JSON Snapshot)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-pink-50/20">
                  <td className="px-5 py-3.5 text-xs text-stone-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('th-TH')}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-xs font-bold text-stone-800">{log.actor_email}</div>
                    <div className="text-[11px] text-pink-600">{log.actor_role}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-lg bg-pink-50 text-pink-700 font-mono text-xs font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-mono text-stone-600">
                    {log.entity_type} ({log.entity_id})
                  </td>
                  <td className="px-5 py-3.5 text-xs font-mono text-stone-500 max-w-md truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
