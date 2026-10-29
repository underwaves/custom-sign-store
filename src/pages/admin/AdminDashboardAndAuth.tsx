import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Clock,
  BadgeDollarSign,
  Search,
  Eye,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { formatTHB } from '@/utils/pricing';
import { getOrderStatusMeta, ORDER_STATUS_LIST } from '@/utils/orderStatus';
import { OrderRecord, OrderStatus } from '@/types/database';
import { toast } from 'sonner';

// ============================================================================
// 1. AdminLoginPage
// ============================================================================
export const AdminLoginPage: React.FC = () => {
  const { loginWithEmail, switchDemoPersona, isAdmin } = useStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@customsignstudio.example.com');
  const [password, setPassword] = useState('admin1234');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await loginWithEmail(email, password);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success('เข้าสู่ระบบผู้ดูแลสำเร็จ');
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4 py-12">
      <div className="card-pastel w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-pink-light text-brand-pink-dark">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <span className="badge-pastel bg-brand-pink-light text-brand-pink-dark">
            Admin Backoffice Authentication
          </span>
          <h1 className="text-2xl font-bold text-brand-brown">เข้าสู่ระบบหลังบ้าน Admin</h1>
          <p className="text-xs text-brand-brown-soft">
            เฉพาะผู้ดูแลระบบที่มีสิทธิ์ในตาราง <code>user_roles</code> (staff, admin, super_admin) เท่านั้น
          </p>
        </div>

        {isAdmin && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2">
            <p className="text-xs font-bold text-emerald-900">คุณเข้าสู่ระบบในฐานะผู้ดูแลระบบอยู่แล้ว</p>
            <Link to="/admin/dashboard" className="btn-primary w-full text-xs">
              เข้าสู่หน้า Admin Dashboard ทันที →
            </Link>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-brand-brown">อีเมลผู้ดูแลระบบ</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-pastel pl-10 text-sm"
              />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-brown-soft" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-brand-brown">รหัสผ่าน</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-pastel pl-10 text-sm"
              />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-brown-soft" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full font-bold">
            {loading ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบ Admin Dashboard'}
          </button>
        </form>

        <div className="rounded-2xl bg-brand-cream p-4 text-xs space-y-2 border border-[#EAD9CE]">
          <p className="font-bold text-brand-brown">สำหรับเจ้าของโปรเจกต์ / ผู้ตรวจประเมิน:</p>
          <button
            type="button"
            onClick={() => {
              switchDemoPersona('admin');
              toast.success('เปิดสิทธิ์ Super Admin (Demo) แล้ว');
              navigate('/admin/dashboard');
            }}
            className="btn-soft w-full font-bold text-xs"
          >
            คลิกเพื่อเข้าสู่ระบบด้วยบัญชี Super Admin (Demo) ทันที
          </button>
        </div>

        <div className="text-center">
          <Link to="/" className="text-xs font-semibold text-brand-brown-soft hover:underline">
            ← กลับสู่หน้าร้านค้าสาธารณะ
          </Link>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. AdminDashboardPage (PART 16: ยอดขายต้องไม่นับรวมออเดอร์ที่ยังไม่ได้ชำระเงินจริง และไม่นับออเดอร์ Demo!)
// ============================================================================
export const AdminDashboardPage: React.FC = () => {
  const {
    orders,
    signCategories,
    signTemplates,
    decorations,
    clearDemoRecords,
    restoreDemoRecords,
  } = useStore();

  // Separate Real Customer Orders vs Demo Orders (PART 20: ออเดอร์ Demo ต้องไม่ถูกนำไปแสดงเสมือนเป็นยอดขายจริง)
  const realOrders = useMemo(() => orders.filter((o) => !o.is_demo), [orders]);
  const demoOrders = useMemo(() => orders.filter((o) => o.is_demo), [orders]);

  const newOrdersCount = orders.filter((o) => o.status === 'pending_review').length;
  const inProgressCount = orders.filter((o) =>
    [
      'awaiting_payment',
      'verifying_payment',
      'designing',
      'awaiting_confirmation',
      'revising',
      'preparing_files',
    ].includes(o.status)
  ).length;
  const completedCount = orders.filter((o) =>
    ['completed', 'delivered'].includes(o.status)
  ).length;

  // Confirmed Real Revenue: ONLY real orders (!is_demo), paid (is_paid === true), and not cancelled
  const confirmedRealRevenue = useMemo(
    () =>
      realOrders
        .filter((o) => o.is_paid && o.status !== 'cancelled')
        .reduce((acc, o) => acc + Number(o.total_amount || 0), 0),
    [realOrders]
  );

  // Demo orders paid total (shown separately for transparency)
  const demoSimulatedPaidTotal = useMemo(
    () =>
      demoOrders
        .filter((o) => o.is_paid && o.status !== 'cancelled')
        .reduce((acc, o) => acc + Number(o.total_amount || 0), 0),
    [demoOrders]
  );

  // Popular Sign Types ranking
  const popularSignStats = useMemo(() => {
    const counts: Record<string, { name: string; count: number; basePrice: number }> = {};
    for (const cat of signCategories) {
      counts[cat.id] = { name: cat.name, count: 0, basePrice: cat.base_price };
    }
    for (const ord of orders) {
      for (const item of ord.items) {
        if (item.sign_category_id && counts[item.sign_category_id]) {
          counts[item.sign_category_id].count += item.quantity;
        }
      }
    }
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [orders, signCategories]);

  return (
    <div className="space-y-6">
      {/* Demo Data Notice & Quick Cleanup */}
      <div className="card-pastel border-amber-200 bg-amber-50/80 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" />
          <span>
            <strong>การแยกข้อมูลจริงและข้อมูล Demo:</strong> ยอดขายที่ยืนยันแล้วจะนับเฉพาะออเดอร์จริงที่ชำระเงินแล้วเท่านั้น
            (ไม่นำออเดอร์ตัวอย่าง Demo {demoOrders.length} รายการมารวมเป็นยอดขายจริง)
          </span>
        </div>
        <div className="flex gap-2">
          {demoOrders.length > 0 ? (
            <button
              type="button"
              onClick={async () => {
                await clearDemoRecords();
                toast.success('ลบออเดอร์และรีวิว Demo ออกแล้ว (โครงสร้างฐานข้อมูลและแคตตาล็อกยังอยู่ครบ)');
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-white border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
            >
              <Trash2 className="h-3.5 w-3.5" /> ลบออเดอร์/รีวิว Demo
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                await restoreDemoRecords();
                toast.success('กู้คืนออเดอร์และรีวิว Demo สำหรับทดสอบแล้ว');
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-white border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
            >
              <RotateCcw className="h-3.5 w-3.5" /> กู้คืนข้อมูล Demo
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards (PART 16) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="card-pastel p-5">
          <div className="flex items-center justify-between text-xs text-brand-brown-soft">
            <span>ออเดอร์ทั้งหมด</span>
            <ShoppingBag className="h-4 w-4 text-brand-pink-dark" />
          </div>
          <p className="mt-2 text-2xl font-bold text-brand-brown">{orders.length}</p>
          <p className="mt-1 text-[11px] text-brand-brown-soft">
            ออเดอร์จริง {realOrders.length} • Demo {demoOrders.length}
          </p>
        </div>

        <div className="card-pastel p-5">
          <div className="flex items-center justify-between text-xs text-brand-brown-soft">
            <span>ออเดอร์ใหม่ (รอตรวจสอบ)</span>
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700">{newOrdersCount}</p>
          <p className="mt-1 text-[11px] text-brand-brown-soft">รอดำเนินการตรวจสอบ</p>
        </div>

        <div className="card-pastel p-5">
          <div className="flex items-center justify-between text-xs text-brand-brown-soft">
            <span>กำลังดำเนินการออกแบบ</span>
            <Clock className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-sky-700">{inProgressCount}</p>
          <p className="mt-1 text-[11px] text-brand-brown-soft">อยู่ในขั้นตอนออกแบบ/แก้ไข</p>
        </div>

        <div className="card-pastel p-5">
          <div className="flex items-center justify-between text-xs text-brand-brown-soft">
            <span>งานเสร็จ / ส่งมอบแล้ว</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{completedCount}</p>
          <p className="mt-1 text-[11px] text-brand-brown-soft">เสร็จสมบูรณ์พร้อมส่งมอบ</p>
        </div>

        <div className="card-pastel p-5 bg-gradient-to-br from-white to-emerald-50/60 border-emerald-200">
          <div className="flex items-center justify-between text-xs text-emerald-900 font-semibold">
            <span>ยอดขายจริงที่ยืนยันชำระแล้ว</span>
            <BadgeDollarSign className="h-4 w-4 text-emerald-700" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-800">
            {formatTHB(confirmedRealRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-emerald-700">
            ไม่นับออเดอร์ค้างชำระ &amp; ไม่นับ Demo ({formatTHB(demoSimulatedPaidTotal)})
          </p>
        </div>
      </div>

      {/* Recent Orders & Popular Sign Types */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="card-pastel p-6 lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-brown">รายการออเดอร์ล่าสุด</h2>
            <Link to="/admin/orders" className="text-xs font-bold text-brand-pink-dark underline">
              จัดการออเดอร์ทั้งหมด →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F2E6DF] text-brand-brown-soft">
                  <th className="py-2.5 pr-3">หมายเลขออเดอร์</th>
                  <th className="py-2.5 px-3">ลูกค้า</th>
                  <th className="py-2.5 px-3">จำนวนป้าย</th>
                  <th className="py-2.5 px-3">ยอดสุทธิ</th>
                  <th className="py-2.5 px-3">การชำระเงิน</th>
                  <th className="py-2.5 pl-3">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2E6DF]">
                {orders.slice(0, 6).map((ord) => {
                  const meta = getOrderStatusMeta(ord.status);
                  return (
                    <tr key={ord.id} className="hover:bg-brand-cream/50">
                      <td className="py-3 pr-3 font-bold text-brand-brown">
                        {ord.order_number}
                        {ord.is_demo && (
                          <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            DEMO
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-brand-brown">{ord.customer_name}</p>
                        <p className="text-[11px] text-brand-brown-soft">{ord.customer_contact}</p>
                      </td>
                      <td className="py-3 px-3">{ord.items.length} รายการ</td>
                      <td className="py-3 px-3 font-bold text-brand-pink-dark">
                        {formatTHB(ord.total_amount)}
                      </td>
                      <td className="py-3 px-3">
                        {ord.is_paid ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            ชำระแล้ว
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                            ยังไม่ชำระ
                          </span>
                        )}
                      </td>
                      <td className="py-3 pl-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Popular Sign Types & Catalog Summary */}
        <div className="space-y-6 lg:col-span-4">
          <div className="card-pastel p-6 space-y-4">
            <h2 className="text-lg font-bold text-brand-brown">ประเภทป้ายยอดนิยม</h2>
            <div className="space-y-3">
              {popularSignStats.map((st, idx) => (
                <div
                  key={st.name}
                  className="flex items-center justify-between rounded-2xl bg-brand-cream px-3.5 py-2.5 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-pink-dark text-[11px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-brand-brown">{st.name}</p>
                      <p className="text-[11px] text-brand-brown-soft">
                        ราคาฐาน {formatTHB(st.basePrice)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 font-bold text-brand-pink-dark">
                    สั่งทำ {st.count} ป้าย
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-pastel p-6 space-y-2 text-xs">
            <h3 className="font-bold text-sm text-brand-brown">สรุปข้อมูลแคตตาล็อกในระบบ</h3>
            <p className="flex justify-between">
              <span className="text-brand-brown-soft">ประเภทป้ายทั้งหมด:</span>
              <strong>{signCategories.length} ประเภท</strong>
            </p>
            <p className="flex justify-between">
              <span className="text-brand-brown-soft">เทมเพลตสำเร็จรูป:</span>
              <strong>{signTemplates.length} เทมเพลต</strong>
            </p>
            <p className="flex justify-between">
              <span className="text-brand-brown-soft">ของตกแต่งฟรี (0 บาท):</span>
              <strong className="text-emerald-700">{decorations.length} ชิ้น</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 11. AdminManageOrdersPage (ดูออเดอร์ ค้นหา กรองสถานะ ดูรายละเอียด เปลี่ยนสถานะ เพิ่มหมายเหตุ และบันทึกประวัติ)
// ============================================================================
export const AdminManageOrdersPage: React.FC = () => {
  const { orders, updateOrderStatus } = useStore();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [demoFilter, setDemoFilter] = useState<'ALL' | 'REAL' | 'DEMO'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  const [newStatus, setNewStatus] = useState<OrderStatus>('pending_review');
  const [statusNote, setStatusNote] = useState<string>('');
  const [internalNote, setInternalNote] = useState<string>('');
  const [isPaidFlag, setIsPaidFlag] = useState<boolean>(false);

  const realOrdersCount = useMemo(() => orders.filter((o) => !o.is_demo).length, [orders]);
  const demoOrdersCount = useMemo(() => orders.filter((o) => o.is_demo).length, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders
      .filter((o) => (statusFilter === 'ALL' ? true : o.status === statusFilter))
      .filter((o) =>
        demoFilter === 'ALL' ? true : demoFilter === 'REAL' ? !o.is_demo : o.is_demo
      )
      .filter(
        (o) =>
          !q ||
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_contact.toLowerCase().includes(q)
      );
  }, [orders, statusFilter, demoFilter, searchQuery]);

  const openOrderModal = (ord: OrderRecord) => {
    setSelectedOrder(ord);
    setNewStatus(ord.status);
    setStatusNote('');
    setInternalNote(ord.internal_note || '');
    setIsPaidFlag(ord.is_paid);
  };

  const handleSaveOrderUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    await updateOrderStatus(
      selectedOrder.id,
      newStatus,
      statusNote || `เปลี่ยนสถานะเป็น ${getOrderStatusMeta(newStatus).label}`,
      internalNote,
      isPaidFlag
    );
    toast.success(`อัปเดตสถานะออเดอร์ ${selectedOrder.order_number} เรียบร้อยแล้ว`);
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-6">
      <div className="card-pastel p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-brand-brown">
              จัดการคำสั่งซื้อ (Manage Orders — {filteredOrders.length} รายการ)
            </h1>
            <p className="text-xs text-brand-brown-soft">
              เปลี่ยนสถานะทั้ง 10 ขั้นตอน ยืนยันยอดชำระเงิน เพิ่มหมายเหตุภายในร้าน และดูข้อมูลที่ลูกค้ากรอกครบทุกฟิลด์
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoFilter('ALL')}
              className={`rounded-xl px-3 py-1.5 font-bold transition ${
                demoFilter === 'ALL'
                  ? 'bg-brand-pink-dark text-white'
                  : 'bg-brand-cream text-brand-brown hover:bg-brand-pink-light'
              }`}
            >
              ทั้งหมด ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setDemoFilter('REAL')}
              className={`rounded-xl px-3 py-1.5 font-bold transition inline-flex items-center gap-1.5 ${
                demoFilter === 'REAL'
                  ? 'bg-brand-pink-dark text-white'
                  : 'bg-brand-cream text-brand-brown hover:bg-brand-pink-light'
              }`}
            >
              <span>ออเดอร์ที่สั่งเข้ามาใหม่ ({realOrdersCount})</span>
              {realOrdersCount > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setDemoFilter('DEMO')}
              className={`rounded-xl px-3 py-1.5 font-bold transition ${
                demoFilter === 'DEMO'
                  ? 'bg-brand-pink-dark text-white'
                  : 'bg-brand-cream text-brand-brown hover:bg-brand-pink-light'
              }`}
            >
              เฉพาะออเดอร์ตัวอย่าง Demo ({demoOrdersCount})
            </button>
          </div>
        </div>

        {/* Helpful alert banner if user selected "เฉพาะออเดอร์ Demo" and real orders are hidden */}
        {demoFilter === 'DEMO' && realOrdersCount > 0 && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
              <span>
                ขณะนี้กำลังกรองดู <strong>"เฉพาะออเดอร์ตัวอย่าง Demo"</strong> — มีออเดอร์ที่ลูกค้าสั่งเข้ามาใหม่{' '}
                <strong>{realOrdersCount} รายการ</strong> (เช่น #{orders.find((o) => !o.is_demo)?.order_number}) ที่ถูกซ่อนอยู่
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDemoFilter('ALL')}
              className="btn-primary !py-1 !px-3 text-xs font-bold"
            >
              คลิกเพื่อดูออเดอร์ทั้งหมด ({orders.length})
            </button>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-brand-brown">กรองตามสถานะ</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-pastel !py-2 text-xs"
            >
              <option value="ALL">ทุกสถานะ (10 สถานะ)</option>
              {ORDER_STATUS_LIST.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-brand-brown">
              ค้นหาหมายเลขออเดอร์ ชื่อลูกค้า หรือเบอร์โทร
            </label>
            <div className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหา CSS-... หรือชื่อลูกค้า"
                className="input-pastel !py-2 pl-9 text-xs"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-brown-soft" />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card-pastel overflow-hidden p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F2E6DF] text-brand-brown-soft">
                <th className="py-3 pr-3">หมายเลขออเดอร์</th>
                <th className="py-3 px-3">ลูกค้า &amp; ช่องทางติดต่อ</th>
                <th className="py-3 px-3">รายการป้าย</th>
                <th className="py-3 px-3">ยอดสุทธิ (Snapshot)</th>
                <th className="py-3 px-3">ชำระเงิน</th>
                <th className="py-3 px-3">สถานะ</th>
                <th className="py-3 pl-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2E6DF]">
              {filteredOrders.map((ord) => {
                const meta = getOrderStatusMeta(ord.status);
                return (
                  <tr key={ord.id} className={`hover:bg-brand-cream/40 ${!ord.is_demo ? 'bg-emerald-50/20' : ''}`}>
                    <td className="py-3.5 pr-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-brand-brown">{ord.order_number}</span>
                        {ord.is_demo ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            DEMO
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shadow-xs">
                            ลูกค้าจริง (ใหม่) ✨
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-brand-brown-soft">
                        {new Date(ord.created_at).toLocaleString('th-TH')}
                      </p>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-brand-brown">{ord.customer_name}</p>
                      <p className="text-brand-brown-soft">
                        {ord.customer_contact} • {ord.delivery_channel}
                      </p>
                    </td>
                    <td className="py-3.5 px-3">
                      {ord.items.map((it, i) => (
                        <p key={it.id} className="text-brand-brown">
                          #{i + 1} {it.snapshot_sign_type_name} ({it.snapshot_template_code})
                        </p>
                      ))}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-brand-pink-dark">
                      {formatTHB(ord.total_amount)}
                    </td>
                    <td className="py-3.5 px-3">
                      {ord.is_paid ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          ชำระเงินแล้ว
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                          รอชำระ
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-3.5 pl-3 text-right">
                      <button
                        type="button"
                        onClick={() => openOrderModal(ord)}
                        className="btn-primary !py-1.5 !px-3 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" /> เปิดดู / เปลี่ยนสถานะ
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Status Update Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F2E6DF] pb-4">
              <div>
                <h2 className="text-xl font-bold text-brand-brown">
                  รายละเอียดออเดอร์ #{selectedOrder.order_number}
                </h2>
                <p className="text-xs text-brand-brown-soft">
                  ลูกค้า: {selectedOrder.customer_name} ({selectedOrder.customer_contact}) • รับงานทาง{' '}
                  {selectedOrder.delivery_channel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="btn-secondary !py-1.5 !px-3 text-xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>

            {/* Items & Full Unmasked Fields for Admin */}
            <div className="space-y-4">
              {selectedOrder.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#EAD9CE] bg-brand-cream p-4 space-y-2.5 text-xs"
                >
                  <div className="flex justify-between font-bold text-sm text-brand-brown">
                    <span>
                      ป้ายใบที่ #{idx + 1}: {item.snapshot_sign_type_name} — {item.snapshot_style_name}{' '}
                      (เทมเพลต {item.snapshot_template_code})
                    </span>
                    <span className="text-brand-pink-dark">{formatTHB(item.item_total_price)}</span>
                  </div>
                  <p className="text-brand-brown-soft">
                    Snapshot ราคาที่ล็อกไว้: ฐาน {formatTHB(item.snapshot_base_price)} + สไตล์{' '}
                    {formatTHB(item.snapshot_style_price)} + ของตกแต่งฟรี 0 บาท × {item.quantity}
                  </p>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {item.fields.map((f, fIdx) => (
                      <div key={fIdx} className="rounded-xl bg-white p-2.5 border border-[#EFE2D9]">
                        <span className="block text-[11px] text-brand-brown-soft">
                          {f.snapshot_field_label}:
                        </span>
                        <strong className="text-brand-brown">{f.field_value || '-'}</strong>
                      </div>
                    ))}
                  </div>

                  <div>
                    <span className="font-bold text-emerald-900">
                      ของตกแต่งฟรีที่เลือก ({item.decorations.length} ชิ้น):{' '}
                    </span>
                    {item.decorations.length === 0
                      ? 'ไม่ได้เลือกเพิ่ม'
                      : item.decorations
                          .map((d) => `${d.snapshot_decoration_name} (${d.snapshot_color_name})`)
                          .join(', ')}
                  </div>
                </div>
              ))}
            </div>

            {/* Admin Update Status & Internal Note Form */}
            <form
              onSubmit={handleSaveOrderUpdate}
              className="rounded-2xl border-2 border-brand-pink bg-brand-pink-light/25 p-5 space-y-4"
            >
              <h3 className="text-sm font-bold text-brand-brown">
                อัปเดตสถานะออเดอร์และบันทึกหมายเหตุภายในร้าน
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-brand-brown">
                    เปลี่ยนสถานะออเดอร์
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                    className="input-pastel !py-2 text-xs"
                  >
                    {ORDER_STATUS_LIST.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-[#EAD9CE] bg-white px-4 py-2.5 text-xs font-bold text-brand-brown w-full">
                    <input
                      type="checkbox"
                      checked={isPaidFlag}
                      onChange={(e) => setIsPaidFlag(e.target.checked)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <span>ยืนยันว่าออเดอร์นี้ชำระเงินจริงแล้ว (นับรวมในยอดขายจริง)</span>
                  </label>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-brand-brown">
                    ข้อความบันทึกในประวัติสถานะ (ลูกค้ามองเห็นในไทม์ไลน์)
                  </label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="เช่น ส่งดราฟต์แรกทาง LINE แล้ว รอลูกค้าคอนเฟิร์ม..."
                    className="input-pastel !py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-brand-brown">
                    หมายเหตุภายในสำหรับทีมแอดมิน (Internal Note — ลูกค้าไม่เห็น)
                  </label>
                  <input
                    type="text"
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="ระบุโน้ตสำหรับนักออกแบบ..."
                    className="input-pastel !py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="btn-secondary !py-2 !px-4 text-xs"
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn-primary !py-2 !px-5 text-xs font-bold">
                  บันทึกการเปลี่ยนแปลงสถานะ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
