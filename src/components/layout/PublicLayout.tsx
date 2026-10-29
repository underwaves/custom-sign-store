import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Heart,
  ShoppingBag,
  User,
  ShieldCheck,
  Menu,
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  PackageSearch,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useOrderWizard } from '@/context/OrderWizardContext';
import { SITE_DECORATIONS } from '@/data/siteDecorations';
import { DreamyAmbientBackground } from '@/components/common/DreamyAmbientBackground';

export const PublicLayout: React.FC = () => {
  const {
    siteSettings,
    currentUser,
    isAdmin,
    favorites,
    connectionMode,
    switchDemoPersona,
    logout,
  } = useStore();
  const { wizard, setStep } = useOrderWizard();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/templates?q=${encodeURIComponent(q)}` : '/templates');
    setMobileMenuOpen(false);
  };

  const handleStartOrder = () => {
    setStep(1);
    navigate('/order-wizard');
    setMobileMenuOpen(false);
  };

  const configuredItemsCount = wizard.items.filter((i) => Boolean(i.sign_category_id)).length;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-brand-pink-light text-brand-pink-dark shadow-xs dreamy-pill-glow'
        : 'text-brand-brown hover:bg-brand-pink-light/60 hover:text-brand-pink-dark'
    }`;

  return (
    <div className="relative flex min-h-screen flex-col bg-brand-cream text-brand-brown">
      {/* Dreamy Pastel Ambient Background ("ฟุ้งๆ" glowing blobs & floating clouds/stars) */}
      <DreamyAmbientBackground />

      {/* Top Database & Role Status Banner (Transparent honesty per PART 22) */}
      <div className="demo-toolbar relative z-40 border-b px-3 py-1.5 text-xs sm:px-4 sm:py-2">
        <div className="demo-toolbar-inner mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {connectionMode === 'supabase_connected' || connectionMode === 'firebase_connected' ? (
              <span className="demo-status inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" /> เชื่อมต่อระบบร้านแล้ว
              </span>
            ) : (
              <span className="demo-status inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-900">
                <AlertTriangle className="h-3.5 w-3.5" /> โหมดทดลอง · ใช้ข้อมูลตัวอย่าง
              </span>
            )}
            <span className="hidden items-center gap-1.5 text-brand-brown-soft md:inline-flex">
              <img
                src={SITE_DECORATIONS.mascots.rabbitCute}
                alt=""
                className="animate-float-slow h-4 w-4 object-contain"
              />
              <span>ของตกแต่งพาสเทลฟรี 0 บาททุกชิ้น</span>
              <img
                src={SITE_DECORATIONS.badges.stampSquare}
                alt=""
                className="animate-wiggle-cute h-3.5 w-3.5 object-contain"
              />
              <span>สั่งทำป้ายออนไลน์ได้เอง 24 ชม.</span>
            </span>
          </div>

          <details className="group relative">
            <summary className="cursor-pointer list-none whitespace-nowrap rounded-full border border-[#eadbd3] bg-white/85 px-2.5 py-0.5 font-semibold text-brand-brown-soft hover:bg-white [&::-webkit-details-marker]:hidden">
              โหมดทดลอง ▾
            </summary>
            <div className="absolute right-0 z-50 mt-2 flex w-max max-w-[calc(100vw-2rem)] flex-wrap items-center gap-2 rounded-2xl border border-[#eadbd3] bg-white p-3 text-xs shadow-lg sm:relative sm:mt-0 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
              <span className="text-brand-brown-soft">สลับบทบาท:</span>
              <button
                type="button"
                onClick={() => switchDemoPersona('guest')}
                className={`whitespace-nowrap rounded-full px-2.5 py-0.5 font-medium transition ${
                  !currentUser
                    ? 'bg-brand-brown text-white'
                    : 'bg-white text-brand-brown hover:bg-brand-pink-light'
                }`}
              >
                ลูกค้าทั่วไป (Guest)
              </button>
              <button
                type="button"
                onClick={() => switchDemoPersona('customer')}
                className={`whitespace-nowrap rounded-full px-2.5 py-0.5 font-medium transition ${
                  currentUser && !isAdmin
                    ? 'bg-brand-pink-dark text-white'
                    : 'bg-white text-brand-brown hover:bg-brand-pink-light'
                }`}
              >
                สมาชิก (Customer)
              </button>
              <button
                type="button"
                onClick={() => {
                  switchDemoPersona('admin');
                }}
                className={`whitespace-nowrap rounded-full px-2.5 py-0.5 font-medium transition ${
                  isAdmin
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-brand-brown hover:bg-brand-pink-light'
                }`}
              >
                แอดมิน (Admin)
              </button>
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> เปิดหลังบ้าน Admin
                </Link>
              )}
            </div>
          </details>
        </div>
      </div>

      {/* Main Header (Clean 2-row layout on desktop so Brand, Search, Nav, and Actions never collide or wrap awkwardly) */}
      <header className="dreamy-header-glass sticky top-0 z-40 border-b border-[#F2DFE7] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3 py-2.5 sm:px-4 sm:py-3">
          {/* Top Row: Brand Lockup + Search Bar + Quick Action Buttons */}
          <div className="site-header-inner flex items-center justify-between gap-3">
            {/* Logo & Shop Name */}
            <Link
              to="/"
              className="brand-lockup group relative flex shrink-0 items-center gap-2.5 sm:gap-3"
            >
              <div className="relative shrink-0">
                <div
                  className="animate-pulse-glow pointer-events-none absolute -inset-1.5 rounded-2xl opacity-75 blur-md"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(255, 182, 209, 0.85) 0%, transparent 75%)',
                  }}
                />
                <img
                  src={siteSettings.branding.logo_url || '/placeholders/logo.svg'}
                  alt={siteSettings.branding.shop_name}
                  className="relative h-10 w-10 shrink-0 rounded-2xl border border-[#F2E6DF] bg-white object-cover shadow-sm transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-11"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <img
                    src={SITE_DECORATIONS.bows.pinkBow}
                    alt=""
                    className="animate-wiggle-cute h-4 w-4 shrink-0 object-contain"
                  />
                  <span className="brand-lockup-title text-base font-bold tracking-tight text-brand-brown sm:text-lg">
                    {siteSettings.branding.shop_name}
                  </span>
                  <img
                    src={SITE_DECORATIONS.sparkles.starMini}
                    alt=""
                    className="animate-twinkle inline-block h-3.5 w-3.5 shrink-0 object-contain"
                  />
                </div>
                <p className="hidden max-w-[240px] truncate text-xs text-brand-brown-soft sm:block lg:max-w-[340px]">
                  {siteSettings.branding.shop_tagline}
                </p>
              </div>
            </Link>

            {/* Search Bar (Visible on md+ in top row with plenty of room) */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden flex-1 max-w-xs md:block lg:max-w-md"
            >
              <div className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาประเภทป้าย หรือ รหัส MIN-001..."
                  className="w-full rounded-2xl border border-[#EAD8DF] bg-white/90 px-3.5 py-2 pl-9 text-sm text-brand-brown shadow-xs transition placeholder:text-[#B39E91] focus:border-brand-pink-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-pink/40"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-brown-soft" />
              </div>
            </form>

            {/* Right Quick Actions & Primary CTA */}
            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/favorites"
                className="mobile-hide-action relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#EAD9CE] bg-white text-brand-brown transition hover:-translate-y-0.5 hover:border-brand-pink hover:bg-brand-pink-light/40"
                title="เทมเพลตที่ถูกใจ"
              >
                <Heart className="h-4 w-4 text-brand-pink-dark" />
                {favorites.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-pink-dark px-1 text-[10px] font-bold text-white shadow-xs">
                    {favorites.length}
                  </span>
                )}
              </Link>

              <Link
                to="/order-summary"
                className="mobile-hide-action relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#EAD9CE] bg-white text-brand-brown transition hover:-translate-y-0.5 hover:border-brand-pink hover:bg-brand-pink-light/40"
                title="สรุปรายการสั่งทำป้าย"
              >
                <ShoppingBag className="h-4 w-4 text-brand-brown" />
                {configuredItemsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-brown px-1 text-[10px] font-bold text-white shadow-xs">
                    {configuredItemsCount}
                  </span>
                )}
              </Link>

              {currentUser ? (
                <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-2xl border border-[#EAD9CE] bg-white px-3 py-2 text-xs font-semibold text-brand-brown transition hover:border-brand-pink hover:bg-brand-pink-light/30"
                  >
                    <User className="h-3.5 w-3.5 text-brand-pink-dark" />
                    <span className="max-w-[100px] truncate">{currentUser.full_name}</span>
                  </Link>
                  <Link
                    to="/my-orders"
                    className="whitespace-nowrap rounded-2xl border border-[#EAD9CE] bg-white px-2.5 py-2 text-xs font-medium text-brand-brown transition hover:border-brand-pink hover:bg-brand-pink-light/30"
                  >
                    ออเดอร์ของฉัน
                  </Link>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden shrink-0 whitespace-nowrap rounded-2xl border border-[#EAD9CE] bg-white px-3.5 py-2 text-xs font-semibold text-brand-brown transition hover:-translate-y-0.5 hover:border-brand-pink hover:bg-brand-pink-light/30 sm:inline-flex"
                >
                  เข้าสู่ระบบ
                </Link>
              )}

              <button
                type="button"
                onClick={handleStartOrder}
                className="header-cta btn-primary shrink-0 whitespace-nowrap !px-3.5 !py-2.5 text-xs sm:!px-4 sm:text-sm"
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span className="header-cta-label">เริ่มสั่งทำป้าย</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#EAD9CE] bg-white text-brand-brown lg:hidden"
                aria-label="เปิดเมนูนำทาง"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Second Row on Desktop (lg+): Dedicated Dreamy Pastel Pill Navigation Bar */}
          <nav className="mt-2.5 hidden items-center justify-between border-t border-[#F4E6EC] pt-2 lg:flex">
            <div className="flex flex-wrap items-center gap-1.5">
              <NavLink to="/" end className={navLinkClass}>
                หน้าแรก
              </NavLink>
              <NavLink to="/categories" className={navLinkClass}>
                ประเภทป้าย (15+)
              </NavLink>
              <NavLink to="/products" className={navLinkClass}>
                รายการป้าย &amp; ราคา
              </NavLink>
              <NavLink to="/templates" className={navLinkClass}>
                แกลเลอรีเทมเพลต
              </NavLink>
              <NavLink to="/track-order" className={navLinkClass}>
                ติดตามออเดอร์
              </NavLink>
              <NavLink to="/faq" className={navLinkClass}>
                คำถามพบบ่อย
              </NavLink>
              <NavLink to="/contact" className={navLinkClass}>
                ติดต่อร้าน
              </NavLink>
            </div>

            <div className="hidden items-center gap-2 text-xs text-brand-brown-soft xl:flex">
              <img
                src={SITE_DECORATIONS.sparkles.mintSparkleCluster}
                alt=""
                className="animate-twinkle h-4 w-4 object-contain"
              />
              <span className="whitespace-nowrap font-medium text-brand-pink-dark">
                ✨ เลือกโทนสีและของตกแต่งฟรี 0฿ ได้ทุกชิ้น
              </span>
              <img
                src={SITE_DECORATIONS.sweets.pinkCupcakeStar}
                alt=""
                className="animate-float-slow h-4 w-4 object-contain"
              />
            </div>
          </nav>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-[#EFE2D9] bg-white/95 px-4 py-4 backdrop-blur-md lg:hidden">
            <form onSubmit={handleSearchSubmit} className="mb-3">
              <div className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาประเภทป้าย หรือ รหัสเทมเพลต..."
                  className="input-pastel !py-2.5 pl-10 text-sm"
                />
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-brand-brown-soft" />
              </div>
            </form>

            <div className="grid grid-cols-2 gap-2 text-sm font-medium">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-brand-cream px-3 py-2">
                หน้าแรก
              </Link>
              <Link to="/categories" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-brand-cream px-3 py-2">
                ประเภทป้ายทั้งหมด
              </Link>
              <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-brand-cream px-3 py-2">
                รายการสินค้า &amp; ราคา
              </Link>
              <Link to="/templates" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-brand-cream px-3 py-2">
                แกลเลอรีเทมเพลต
              </Link>
              <Link to="/order-wizard" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-brand-pink-light px-3 py-2 font-bold text-brand-pink-dark">
                สั่งทำป้าย (Wizard)
              </Link>
              <Link to="/track-order" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-brand-cream px-3 py-2">
                ติดตามสถานะงาน
              </Link>
              <Link to="/favorites" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-brand-cream px-3 py-2">
                รายการโปรด ({favorites.length})
              </Link>
              <Link to="/my-orders" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-brand-cream px-3 py-2">
                ประวัติคำสั่งซื้อ
              </Link>
              <Link to="/faq" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-brand-cream px-3 py-2">
                คำถามที่พบบ่อย
              </Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-brand-cream px-3 py-2">
                ติดต่อร้านค้า
              </Link>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[#EFE2D9] pt-3 text-xs">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="font-semibold text-brand-brown underline">
                    โปรไฟล์: {currentUser.full_name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      void logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-rose-600 underline"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-secondary !py-1.5 !px-3 text-xs">
                    เข้าสู่ระบบ
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn-soft !py-1.5 !px-3 text-xs">
                    สมัครสมาชิก
                  </Link>
                </div>
              )}
              <Link to="/admin/login" onClick={() => setMobileMenuOpen(false)} className="font-semibold text-brand-brown-soft underline">
                สำหรับผู้ดูแลระบบ
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1">
        <Outlet />
      </main>

      {/* Footer (PART 5 #16) */}
      <footer className="site-footer relative z-10 mt-20 overflow-hidden border-t border-[#EAD9CE]">
        {/* Purposeful footer background accents with dreamy glow & floating animations */}
        <div
          className="animate-pulse-glow pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full opacity-70 blur-2xl"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 198, 218, 0.75) 0%, transparent 72%)',
          }}
        />
        <img
          src={SITE_DECORATIONS.bows.pinkBow}
          alt=""
          className="animate-wiggle-cute pointer-events-none absolute right-8 top-4 hidden h-10 w-10 object-contain opacity-85 lg:block"
        />
        <img
          src={SITE_DECORATIONS.sparkles.starBurst}
          alt=""
          className="animate-twinkle pointer-events-none absolute left-6 top-6 hidden h-8 w-8 object-contain opacity-80 lg:block"
        />
        <img
          src={SITE_DECORATIONS.mascots.bearPudding}
          alt=""
          className="animate-float-slow pointer-events-none absolute bottom-4 right-6 hidden h-16 w-16 object-contain opacity-90 xl:block"
        />

        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={siteSettings.branding.logo_url || '/placeholders/logo.svg'}
                  alt={siteSettings.branding.shop_name}
                  className="h-10 w-10 rounded-2xl border border-[#F2E6DF]"
                />
                <span className="text-lg font-bold text-brand-brown">
                  {siteSettings.branding.shop_name}
                </span>
              </div>
              <p className="text-sm text-brand-brown-soft">
                {siteSettings.branding.shop_tagline}
              </p>
              <div className="relative overflow-hidden rounded-2xl border border-[#F0E2DA] bg-brand-cream p-3.5 pr-12 text-xs text-brand-brown-soft">
                <img
                  src={SITE_DECORATIONS.mascots.mascotDonut}
                  alt=""
                  className="animate-float-delayed pointer-events-none absolute bottom-1.5 right-2 h-10 w-10 object-contain opacity-90"
                />
                {siteSettings.contact_footer.footer_note}
              </div>
            </div>

            <div>
              <h4 className="mb-3 flex items-center gap-2 font-bold text-brand-brown">
                <img src={SITE_DECORATIONS.sweets.pinkCupcakeStar} alt="" className="animate-float-slow h-5 w-5 object-contain" />
                เมนูสั่งทำป้าย
              </h4>
              <ul className="space-y-2 text-sm text-brand-brown-soft">
                <li><Link to="/categories" className="hover:text-brand-pink-dark">เลือกประเภทป้าย (15 ประเภท)</Link></li>
                <li><Link to="/products" className="hover:text-brand-pink-dark">รายการป้ายและเรทราคา</Link></li>
                <li><Link to="/templates" className="hover:text-brand-pink-dark">แกลเลอรีเทมเพลตสำเร็จรูป</Link></li>
                <li><Link to="/order-wizard" className="hover:text-brand-pink-dark">ระบบสั่งทำป้าย (Order Wizard)</Link></li>
                <li><Link to="/order-summary" className="hover:text-brand-pink-dark">ตรวจสอบตะกร้าออเดอร์</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 flex items-center gap-2 font-bold text-brand-brown">
                <img src={SITE_DECORATIONS.mascots.bumbleBee} alt="" className="animate-float-delayed h-5 w-5 object-contain" />
                บริการลูกค้า &amp; สมาชิก
              </h4>
              <ul className="space-y-2 text-sm text-brand-brown-soft">
                <li>
                  <Link to="/track-order" className="inline-flex items-center gap-1 hover:text-brand-pink-dark">
                    <PackageSearch className="h-4 w-4" /> ติดตามสถานะคำสั่งซื้อ
                  </Link>
                </li>
                <li><Link to="/my-orders" className="hover:text-brand-pink-dark">ประวัติคำสั่งซื้อของฉัน</Link></li>
                <li><Link to="/favorites" className="hover:text-brand-pink-dark">เทมเพลตที่บันทึกไว้</Link></li>
                <li><Link to="/faq" className="hover:text-brand-pink-dark">คำถามที่พบบ่อย (FAQ)</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-brand-pink-dark">นโยบายความเป็นส่วนตัว</Link></li>
                <li><Link to="/terms" className="hover:text-brand-pink-dark">ข้อกำหนดและเงื่อนไขการใช้บริการ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 flex items-center gap-2 font-bold text-brand-brown">
                <img src={SITE_DECORATIONS.cafe.icedBearCup} alt="" className="animate-float-slow h-5 w-5 object-contain" />
                ช่องทางติดต่อร้านค้า
              </h4>
              <ul className="space-y-2 text-sm text-brand-brown-soft">
                <li>LINE Official: <strong className="text-brand-brown">{siteSettings.contact_footer.line_id}</strong></li>
                <li>Instagram: <strong className="text-brand-brown">{siteSettings.contact_footer.instagram}</strong></li>
                <li>Facebook: <strong className="text-brand-brown">{siteSettings.contact_footer.facebook}</strong></li>
                <li>โทร: <strong className="text-brand-brown">{siteSettings.contact_footer.phone}</strong></li>
                <li className="text-xs">{siteSettings.contact_footer.working_hours}</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAD9CE] bg-brand-cream px-3 py-1.5 text-xs font-semibold text-brand-brown hover:border-brand-pink"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-pink-dark" /> ระบบหลังบ้าน Admin
                </Link>
                <Link
                  to="/admin/site-settings"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAD9CE] bg-brand-cream px-3 py-1.5 text-xs font-semibold text-brand-brown hover:border-brand-pink"
                >
                  <Database className="h-3.5 w-3.5 text-brand-pink-dark" /> ตั้งค่าระบบ &amp; ธีมสี
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-[#F2E6DF] pt-6 text-xs text-brand-brown-soft sm:flex-row">
            <p>© {new Date().getFullYear()} {siteSettings.branding.shop_name}. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <img src={SITE_DECORATIONS.badges.stampSquare} alt="" className="animate-wiggle-cute inline h-4 w-4 object-contain" />
              <span>ออกแบบสไตล์ Cute Pastel + Minimal</span>
              <span>•</span>
              <img src={SITE_DECORATIONS.sweets.miniHeart} alt="" className="animate-twinkle inline h-3.5 w-3.5 object-contain" />
              <span>ของตกแต่งทุกชิ้นฟรี 0 บาท</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
