import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Mail,
  Phone,
  MessageCircle,
  Heart,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  LogOut,
  Eye,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useOrderWizard } from '@/context/OrderWizardContext';
import { formatTHB } from '@/utils/pricing';
import { getOrderStatusMeta } from '@/utils/orderStatus';
import { OrderRecord } from '@/types/database';
import { SITE_DECORATIONS, TEMPLATE_CARD_ACCENTS } from '@/data/siteDecorations';
import { SectionHeaderBannerDecor } from '@/components/common/CardFrameDecoration';
import { toast } from 'sonner';

// ============================================================================
// 10. LoginPage
// ============================================================================
export const LoginPage: React.FC = () => {
  const { loginWithEmail, switchDemoPersona } = useStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('customer@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await loginWithEmail(email, password);
      if (error) {
        toast.error(`เข้าสู่ระบบไม่สำเร็จ: ${error}`);
        return;
      }
      toast.success('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับกลับมาค่ะ!');
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card-pastel relative overflow-visible p-6 sm:p-8 space-y-6">
        <img
          src={SITE_DECORATIONS.bows.pinkBow}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute -top-3.5 left-1/2 z-10 h-9 w-9 -translate-x-1/2 object-contain drop-shadow-sm"
        />
        <img
          src={SITE_DECORATIONS.mascots.toastEggSmile}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute -right-3 -top-3 z-10 h-14 w-14 rotate-6 object-contain drop-shadow-sm"
        />
        <img
          src={SITE_DECORATIONS.sparkles.starBurst}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute -bottom-2.5 -left-2.5 z-10 h-8 w-8 object-contain"
        />

        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-pink-light text-brand-pink-dark shadow-sm">
            <User className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-brand-brown">เข้าสู่ระบบสมาชิก</h1>
          <p className="text-xs text-brand-brown-soft">
            จัดการโปรไฟล์ ดูประวัติคำสั่งซื้อ บันทึกเทมเพลตโปรด และกดสั่งซื้อซ้ำได้สะดวก
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-brand-brown">อีเมล</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-pastel pl-10 text-sm"
                placeholder="you@example.com"
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
                placeholder="••••••••"
              />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-brown-soft" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full font-bold">
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="relative overflow-hidden rounded-2xl bg-brand-cream p-4 text-xs space-y-2">
          <img
            src={SITE_DECORATIONS.mascots.rabbitCute}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none absolute -right-1 -top-1 h-10 w-10 object-contain opacity-90"
          />
          <p className="font-bold text-brand-brown pr-8">เข้าสู่ระบบด่วนสำหรับทดสอบระบบ (Demo):</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                switchDemoPersona('customer');
                toast.success('สลับเป็นบัญชีลูกค้าสมาชิก (Demo) แล้ว');
                navigate('/profile');
              }}
              className="btn-secondary !py-1.5 !px-3 text-xs flex-1"
            >
              เข้าเป็นลูกค้าสมาชิก
            </button>
            <button
              type="button"
              onClick={() => {
                switchDemoPersona('admin');
                toast.success('สลับเป็นบัญชีแอดมิน (Demo) แล้ว');
                navigate('/admin/dashboard');
              }}
              className="btn-soft !py-1.5 !px-3 text-xs flex-1 font-bold"
            >
              เข้าเป็น Admin
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-brand-brown-soft">
          ยังไม่มีบัญชีสมาชิก?{' '}
          <Link to="/register" className="font-bold text-brand-pink-dark underline">
            สมัครสมาชิกใหม่ที่นี่
          </Link>
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// 11. RegisterPage
// ============================================================================
export const RegisterPage: React.FC = () => {
  const { registerWithEmail } = useStore();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactChannel, setContactChannel] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setLoading(true);
    try {
      const { error } = await registerWithEmail({
        email,
        password,
        full_name: fullName,
        phone,
        contact_channel: contactChannel,
      });
      if (error) {
        toast.error(`สมัครสมาชิกไม่สำเร็จ: ${error}`);
        return;
      }
      toast.success('สมัครสมาชิกสำเร็จแล้ว!');
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="card-pastel relative overflow-visible p-6 sm:p-8 space-y-6">
        <img
          src={SITE_DECORATIONS.bows.pinkBow}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute -top-3.5 left-1/2 z-10 h-9 w-9 -translate-x-1/2 object-contain drop-shadow-sm"
        />
        <img
          src={SITE_DECORATIONS.mascots.bearPudding}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute -right-3 -top-3 z-10 h-14 w-14 rotate-6 object-contain drop-shadow-sm"
        />
        <img
          src={SITE_DECORATIONS.sweets.miniHeart}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute -bottom-2.5 -left-2.5 z-10 h-8 w-8 object-contain"
        />

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-brand-brown">สมัครสมาชิกใหม่</h1>
          <p className="text-xs text-brand-brown-soft">
            สมัครฟรี! เพื่อบันทึกข้อมูลติดต่อ ประวัติการสั่งทำป้าย และรายการเทมเพลตที่ชอบ
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-brand-brown">
              ชื่อ-นามสกุล หรือ ชื่อร้านค้า *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="เช่น คุณฟ้าใส (ร้าน Pastel Dress)"
              className="input-pastel text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-brand-brown">อีเมล *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-pastel text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-brand-brown">เบอร์โทรศัพท์ *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081-234-5678"
                className="input-pastel text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-brand-brown">
              LINE ID / ช่องทางโซเชียลสำหรับรับไฟล์งาน
            </label>
            <input
              type="text"
              value={contactChannel}
              onChange={(e) => setContactChannel(e.target.value)}
              placeholder="เช่น LINE: @myshop"
              className="input-pastel text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-brand-brown">
              ตั้งรหัสผ่าน (อย่างน้อย 6 ตัวอักษร) *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-pastel text-sm"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full font-bold">
            {loading ? 'กำลังสร้างบัญชี...' : 'ยืนยันการสมัครสมาชิก'}
          </button>
        </form>

        <p className="text-center text-xs text-brand-brown-soft">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/login" className="font-bold text-brand-pink-dark underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// 12. CustomerProfilePage
// ============================================================================
export const CustomerProfilePage: React.FC = () => {
  const { currentUser, updateCurrentUserProfile, logout, switchDemoPersona } = useStore();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(currentUser?.full_name ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [contactChannel, setContactChannel] = useState(currentUser?.contact_channel ?? '');

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="card-pastel relative overflow-visible p-8 space-y-4">
          <img
            src={SITE_DECORATIONS.mascots.mascotHeadBerry}
            alt=""
            aria-hidden="true"
            className="mx-auto h-14 w-14 object-contain drop-shadow-sm"
          />
          <h1 className="text-xl font-bold text-brand-brown">กรุณาเข้าสู่ระบบเพื่อจัดการโปรไฟล์</h1>
          <div className="flex flex-col gap-2">
            <Link to="/login" className="btn-primary">
              ไปหน้าเข้าสู่ระบบ
            </Link>
            <button
              type="button"
              onClick={() => switchDemoPersona('customer')}
              className="btn-secondary text-xs"
            >
              ทดลองเข้าด้วยบัญชีลูกค้าสมาชิก (Demo)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCurrentUserProfile({
      full_name: fullName,
      phone,
      contact_channel: contactChannel,
    });
    toast.success('บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div className="card-pastel relative overflow-visible p-6 sm:p-8">
        <img
          src={SITE_DECORATIONS.bows.pinkBow}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute -top-3 left-8 z-10 h-9 w-9 -rotate-12 object-contain drop-shadow-sm"
        />
        <img
          src={SITE_DECORATIONS.mascots.rabbitCute}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute -right-2 -bottom-2 z-10 h-14 w-14 object-contain drop-shadow-sm"
        />

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F2E6DF] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-pink-light text-brand-pink-dark font-bold text-xl shadow-sm">
              {currentUser.full_name.slice(0, 1)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-brown">{currentUser.full_name}</h1>
              <p className="text-xs text-brand-brown-soft">
                {currentUser.email} • บทบาท: <strong>{currentUser.role || 'customer'}</strong>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link to="/my-orders" className="btn-secondary !py-2 !px-3.5 text-xs">
              <ShoppingBag className="h-3.5 w-3.5" /> ประวัติออเดอร์
            </Link>
            <Link to="/favorites" className="btn-secondary !py-2 !px-3.5 text-xs">
              <Heart className="h-3.5 w-3.5 text-brand-pink-dark" /> รายการโปรด
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700"
            >
              <LogOut className="inline h-3.5 w-3.5 mr-1" /> ออกจากระบบ
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-brand-brown">
              ชื่อ-นามสกุล / ชื่อผู้สั่งซื้อเริ่มต้น
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-pastel text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-brand-brown">
              เบอร์โทรศัพท์ <Phone className="inline h-3.5 w-3.5" />
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-pastel text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-brand-brown">
              ช่องทางติดต่อหลัก <MessageCircle className="inline h-3.5 w-3.5" />
            </label>
            <input
              type="text"
              value={contactChannel}
              onChange={(e) => setContactChannel(e.target.value)}
              className="input-pastel text-sm"
            />
          </div>

          <div className="sm:col-span-2 pt-2">
            <button type="submit" className="btn-primary text-sm">
              <CheckCircle2 className="h-4 w-4" /> บันทึกการเปลี่ยนแปลงโปรไฟล์
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 13. MyOrdersPage (History, View Details, Reorder per PART 15)
// ============================================================================
export const MyOrdersPage: React.FC = () => {
  const { orders, currentUser } = useStore();
  const { reorderFromPastOrder } = useOrderWizard();
  const navigate = useNavigate();

  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Customers see their own orders, plus any orders created in the current session
  const myOrders = orders.filter(
    (o) =>
      !o.is_demo ||
      (currentUser && o.user_id === currentUser.id) ||
      orders.some((x) => !x.is_demo) === false
  );

  const handleReorder = (order: OrderRecord) => {
    reorderFromPastOrder(order);
    navigate('/order-wizard');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <div className="card-pastel relative overflow-hidden p-6 flex flex-wrap items-center justify-between gap-4">
        <SectionHeaderBannerDecor
          leftMascot={SITE_DECORATIONS.mascots.bumbleBee}
          rightSweet={SITE_DECORATIONS.sweets.custardPuddingSpoon}
          topBow={SITE_DECORATIONS.bows.pinkBow}
        />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-brand-brown">ประวัติคำสั่งซื้อของฉัน (My Orders)</h1>
          <p className="text-sm text-brand-brown-soft">
            ดูรายละเอียดออเดอร์ย้อนหลัง ตรวจสอบ Snapshot ราคาเดิม และกดสั่งซื้อซ้ำ (Reorder) ได้ในคลิกเดียว
          </p>
        </div>
        <Link to="/order-wizard" className="btn-primary relative z-10 text-xs">
          <Sparkles className="h-4 w-4" /> + สั่งทำป้ายออเดอร์ใหม่
        </Link>
      </div>

      {myOrders.length === 0 ? (
        <div className="card-pastel relative overflow-hidden p-12 text-center space-y-3">
          <img
            src={SITE_DECORATIONS.mascots.mascotDonut}
            alt=""
            aria-hidden="true"
            className="mx-auto h-16 w-16 object-contain drop-shadow-sm"
          />
          <p className="text-lg font-bold text-brand-brown">ยังไม่มีประวัติคำสั่งซื้อ</p>
          <Link to="/order-wizard" className="btn-primary inline-flex text-sm">
            เริ่มสั่งทำป้ายใบแรกเลย
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myOrders.map((order, idx) => {
            const statusMeta = getOrderStatusMeta(order.status);
            return (
              <div key={order.id} className="card-pastel relative overflow-hidden p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F2E6DF] pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        idx % 2 === 0
                          ? SITE_DECORATIONS.sweets.custardPuddingSpoon
                          : SITE_DECORATIONS.mascots.rabbitCute
                      }
                      alt=""
                      aria-hidden="true"
                      className="animate-float-slow h-11 w-11 shrink-0 object-contain drop-shadow-xs"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-bold text-brand-brown">
                          #{order.order_number}
                        </span>
                        <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${statusMeta.badgeClass}`}>
                          {statusMeta.label}
                        </span>
                        {order.is_demo && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                            ออเดอร์ตัวอย่าง Demo
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-brand-brown-soft">
                        สั่งเมื่อ {new Date(order.created_at).toLocaleString('th-TH')} • ช่องทางรับงาน:{' '}
                        {order.delivery_channel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-brand-pink-dark mr-2">
                      {formatTHB(order.total_amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedOrder(selectedOrder?.id === order.id ? null : order)
                      }
                      className="btn-secondary !py-2 !px-3.5 text-xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{selectedOrder?.id === order.id ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReorder(order)}
                      className="btn-primary !py-2 !px-3.5 text-xs"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> สั่งซื้อซ้ำ
                    </button>
                  </div>
                </div>

                {/* Brief Items Summary */}
                <div className="flex flex-wrap gap-2 text-xs pr-10">
                  {order.items.map((it, i) => (
                    <span
                      key={it.id}
                      className="rounded-xl border border-[#EAD9CE] bg-brand-cream px-3 py-1.5 font-medium text-brand-brown"
                    >
                      #{i + 1} {it.snapshot_sign_type_name} ({it.snapshot_template_code}) —{' '}
                      <strong>{formatTHB(it.item_total_price)}</strong> (ราคาที่ล็อกไว้ตอนสั่งซื้อ)
                    </span>
                  ))}
                </div>

                {/* Expanded Order Details */}
                {selectedOrder?.id === order.id && (
                  <div className="mt-4 rounded-2xl bg-brand-cream p-4 space-y-3 text-xs border border-[#EAD9CE]">
                    <p className="font-bold text-brand-brown">
                      รายละเอียดครบถ้วนของออเดอร์ #{order.order_number}:
                    </p>
                    {order.items.map((item, itemIdx) => (
                      <div key={item.id} className="rounded-xl bg-white p-3.5 space-y-1.5">
                        <div className="flex justify-between font-bold text-brand-brown">
                          <span>
                            รายการที่ {itemIdx + 1}: {item.snapshot_sign_type_name} —{' '}
                            {item.snapshot_style_name} (เทมเพลต {item.snapshot_template_code})
                          </span>
                          <span className="text-brand-pink-dark">
                            {formatTHB(item.item_total_price)}
                          </span>
                        </div>
                        <p className="text-brand-brown-soft">
                          Snapshot ราคาตอนสั่งซื้อ: ฐาน {formatTHB(item.snapshot_base_price)} + สไตล์{' '}
                          {formatTHB(item.snapshot_style_price)} + ของตกแต่งฟรี 0 บาท
                        </p>
                        {item.decorations.length > 0 && (
                          <p className="text-emerald-800">
                            ของตกแต่งฟรี:{' '}
                            {item.decorations.map((d) => d.snapshot_decoration_name).join(', ')}
                          </p>
                        )}
                        <div className="grid gap-1 sm:grid-cols-2 pt-1">
                          {item.fields.map((f, fIdx) => (
                            <span key={fIdx} className="text-brand-brown">
                              • <strong>{f.snapshot_field_label}:</strong> {f.field_value}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 14. FavoritesPage
// ============================================================================
export const FavoritesPage: React.FC = () => {
  const { favorites, signTemplates, signCategories, signStyles, toggleFavorite } = useStore();
  const { startOrderWithTemplate } = useOrderWizard();
  const navigate = useNavigate();

  const favoriteTemplates = signTemplates.filter((t) => favorites.includes(t.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <div className="card-pastel relative overflow-hidden p-6 flex flex-wrap items-center justify-between gap-4">
        <SectionHeaderBannerDecor
          leftMascot={SITE_DECORATIONS.mascots.bearPudding}
          rightSweet={SITE_DECORATIONS.sweets.pinkCupcakeStar}
          topBow={SITE_DECORATIONS.bows.pinkBow}
        />
        <div className="relative z-10">
          <span className="badge-pastel bg-brand-pink-light text-brand-pink-dark">
            <Heart className="h-3.5 w-3.5" /> รายการเทมเพลตโปรด (Favorites)
          </span>
          <h1 className="mt-2 text-2xl font-bold text-brand-brown">
            เทมเพลตป้ายที่คุณบันทึกไว้ ({favoriteTemplates.length} รายการ)
          </h1>
        </div>
        <Link to="/templates" className="btn-secondary relative z-10 text-xs">
          ดูแกลเลอรีเทมเพลตทั้งหมด
        </Link>
      </div>

      {favoriteTemplates.length === 0 ? (
        <div className="card-pastel relative overflow-hidden p-12 text-center space-y-3">
          <img
            src={SITE_DECORATIONS.mascots.mascotBerryFace}
            alt=""
            aria-hidden="true"
            className="mx-auto h-16 w-16 object-contain drop-shadow-sm"
          />
          <p className="text-lg font-bold text-brand-brown">ยังไม่มีเทมเพลตที่บันทึกไว้</p>
          <p className="text-sm text-brand-brown-soft">
            กดปุ่มรูปหัวใจบนการ์ดเทมเพลตที่ชอบเพื่อเก็บไว้เปรียบเทียบและสั่งทำภายหลังได้ค่ะ
          </p>
          <Link to="/templates" className="btn-primary inline-flex text-sm">
            ไปเลือกดูเทมเพลต
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {favoriteTemplates.map((tpl, idx) => {
            const cat = signCategories.find((c) => c.id === tpl.sign_category_id);
            const style = signStyles.find((s) => s.id === tpl.style_id);
            const price =
              (tpl.base_price_override ?? cat?.base_price ?? 59) + (style?.price_modifier ?? 0);
            const accent = TEMPLATE_CARD_ACCENTS[idx % TEMPLATE_CARD_ACCENTS.length];

            return (
              <div key={tpl.id} className="card-pastel card-pastel-hover relative flex flex-col justify-between overflow-hidden">
                <div className="relative aspect-[4/5] bg-brand-cream p-3">
                  <img
                    src={tpl.preview_image_url}
                    alt={tpl.name}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                  <span className="absolute left-5 top-5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand-brown shadow-sm">
                    {tpl.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => void toggleFavorite(tpl.id)}
                    className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm hover:bg-rose-50"
                    title="นำออกจากรายการโปรด"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <img
                    src={accent.badge}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none select-none absolute bottom-4 right-4 h-9 w-9 object-contain drop-shadow-sm"
                  />
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-brand-brown-soft">
                      {cat?.name} • {style?.code}
                    </p>
                    <h3 className="font-bold text-brand-brown">{tpl.name}</h3>
                    <p className="text-sm font-bold text-brand-pink-dark mt-1">
                      {formatTHB(price)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      startOrderWithTemplate(tpl.id);
                      navigate('/order-wizard');
                    }}
                    className="btn-primary w-full !py-2 text-xs font-bold"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> สั่งทำป้ายด้วยเทมเพลตนี้
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
