import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Layers,
  Sparkles,
  Image,
  Palette,
  Network,
  Gift,
  FormInput,
  ShoppingBag,
  Users,
  BadgeDollarSign,
  TicketPercent,
  MessageSquareHeart,
  FileEdit,
  Settings,
  ShieldCheck,
  Activity,
  ExternalLink,
  LogOut,
  Lock,
  Menu,
  X,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';

const ADMIN_NAV_ITEMS = [
  { to: '/admin/dashboard', label: '1. ภาพรวม (Dashboard)', icon: LayoutDashboard },
  { to: '/admin/orders', label: '2. จัดการออเดอร์', icon: ShoppingBag },
  { to: '/admin/categories', label: '3. จัดการหมวดหมู่หลัก', icon: FolderKanban },
  { to: '/admin/sign-types', label: '4. จัดการประเภทป้าย (15+)', icon: Layers },
  { to: '/admin/styles', label: '5. จัดการสไตล์ (Minimal/Dec)', icon: Sparkles },
  { to: '/admin/templates', label: '6. จัดการเทมเพลตสำเร็จรูป', icon: Image },
  { to: '/admin/decoration-colors', label: '7. จัดการสีของตกแต่ง', icon: Palette },
  { to: '/admin/decoration-categories', label: '8. จัดการหมวดย่อยของตกแต่ง', icon: Network },
  { to: '/admin/decorations', label: '9. จัดการของตกแต่งฟรี (0฿)', icon: Gift },
  { to: '/admin/form-fields', label: '10. จัดการฟิลด์กรอกข้อมูล', icon: FormInput },
  { to: '/admin/pricing', label: '11. จัดการเรทราคา', icon: BadgeDollarSign },
  { to: '/admin/promotions', label: '12. จัดการโปรโมชั่น/โค้ดลด', icon: TicketPercent },
  { to: '/admin/customers', label: '13. จัดการข้อมูลลูกค้า', icon: Users },
  { to: '/admin/reviews', label: '14. จัดการรีวิวลูกค้า', icon: MessageSquareHeart },
  { to: '/admin/website-content', label: '15. จัดการเนื้อหาหน้าเว็บ', icon: FileEdit },
  { to: '/admin/site-settings', label: '16. ตั้งค่าร้าน & ธีมสี & DB', icon: Settings },
  { to: '/admin/users', label: '17. จัดการสิทธิ์ผู้ดูแลระบบ', icon: ShieldCheck },
  { to: '/admin/activity-logs', label: '18. บันทึกกิจกรรม (Audit Logs)', icon: Activity },
];

export const AdminLayout: React.FC = () => {
  const { currentUser, isAdmin, siteSettings, logout } = useStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Strict authorization guard (PART 19: ลูกค้าเข้าถึง Admin Dashboard ไม่ได้หากไม่มีสิทธิ์)
  if (!currentUser || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-4 py-12">
        <div className="card-pastel max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-100 text-rose-700">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-brand-brown">จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ</h1>
          <p className="mt-2 text-sm text-brand-brown-soft">
            บัญชีปัจจุบันของคุณ ({currentUser ? `${currentUser.email} — สิทธิ์ลูกค้าทั่วไป` : 'ยังไม่ได้เข้าสู่ระบบ'})
            ไม่มีสิทธิ์เข้าถึงระบบหลังบ้าน Admin Dashboard (ตรวจสอบสิทธิ์ผ่านตาราง{' '}
            <code className="rounded bg-brand-cream px-1.5 py-0.5 text-xs">user_roles</code> และ RLS)
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link to="/admin/login" className="btn-primary w-full">
              ไปหน้าเข้าสู่ระบบผู้ดูแล (Admin Login)
            </Link>
            <Link to="/" className="btn-secondary w-full">
              กลับสู่หน้าร้านค้า
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAF4F0] text-brand-brown">
      {/* Desktop Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-[#EAD9CE] bg-white lg:flex">
        <div className="flex items-center justify-between border-b border-[#F2E6DF] p-5">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <img
              src={siteSettings.branding.logo_url || '/placeholders/logo.svg'}
              alt="Admin"
              className="h-10 w-10 rounded-2xl border border-[#F2E6DF]"
            />
            <div>
              <span className="block text-sm font-bold text-brand-brown">
                {siteSettings.branding.shop_name}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-pink-light px-2 py-0.5 text-[11px] font-bold text-brand-pink-dark">
                Admin Studio Backoffice
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-brand-pink-dark text-white shadow-sm'
                      : 'text-brand-brown hover:bg-brand-pink-light/50'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-[#F2E6DF] p-4 space-y-2">
          <div className="rounded-2xl bg-brand-cream p-3 text-xs">
            <p className="font-bold text-brand-brown truncate">{currentUser.full_name}</p>
            <p className="text-brand-brown-soft truncate">{currentUser.email}</p>
            <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
              Role: {currentUser.role || 'admin'}
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#EAD9CE] bg-white px-3 py-2 text-xs font-semibold text-brand-brown hover:bg-brand-cream"
            >
              <ExternalLink className="h-3.5 w-3.5" /> ดูหน้าร้าน
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/admin/login');
              }}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              <LogOut className="h-3.5 w-3.5" /> ออก
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#EAD9CE] bg-white/95 px-4 py-3 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#EAD9CE] bg-white text-brand-brown lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <h2 className="text-sm font-bold text-brand-brown sm:text-base">
                ระบบบริหารจัดการร้าน Custom Sign Studio
              </h2>
              <p className="text-xs text-brand-brown-soft">
                ข้อมูลตัวอย่าง (Demo) แยกออกจากยอดขายและออเดอร์จริงอย่างชัดเจน • ของตกแต่งทุกชิ้นฟรี 0 บาท
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/order-wizard"
              className="hidden rounded-xl bg-brand-pink-light px-3 py-1.5 text-xs font-bold text-brand-pink-dark hover:bg-brand-pink/50 sm:inline-flex"
            >
              ทดสอบหน้าสั่งทำป้าย
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAD9CE] bg-white px-3 py-1.5 text-xs font-semibold text-brand-brown hover:bg-brand-cream"
            >
              <ExternalLink className="h-3.5 w-3.5" /> กลับหน้าร้าน
            </Link>
          </div>
        </header>

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div className="border-b border-[#EAD9CE] bg-white p-4 lg:hidden">
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                        isActive
                          ? 'bg-brand-pink-dark text-white'
                          : 'bg-brand-cream text-brand-brown'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
