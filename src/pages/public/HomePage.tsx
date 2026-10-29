import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Gift,
  Heart,
  Star,
  CheckCircle2,
  Eye,
  ShieldCheck,
  Clock,
  MessageCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useOrderWizard } from '@/context/OrderWizardContext';
import { formatTHB } from '@/utils/pricing';
import { ImageLightboxModal } from '@/components/common/ImageLightboxModal';
import { CardStickerDecor } from '@/components/common/CardFrameDecoration';
import { SignTemplate } from '@/types/database';
import {
  SITE_DECORATIONS,
  CATEGORY_DECOR_PRESETS,
  PACKAGE_DECOR_PRESETS,
  STEP_DECOR_PRESETS,
  HIGHLIGHT_DECOR_PRESETS,
  REVIEW_DECOR_PRESETS,
  TEMPLATE_CARD_ACCENTS,
} from '@/data/siteDecorations';

export const HomePage: React.FC = () => {
  const {
    siteSettings,
    signCategories,
    signStyles,
    signTemplates,
    decorations,
    decorationColors,
    reviews,
    favorites,
    toggleFavorite,
  } = useStore();
  const { selectSignCategory, startOrderWithTemplate, setStep } = useOrderWizard();
  const navigate = useNavigate();

  const [previewTemplate, setPreviewTemplate] = useState<SignTemplate | null>(null);

  const activeCategories = signCategories.filter((c) => c.is_active);
  const popularCategories = activeCategories.filter((c) => c.is_popular).slice(0, 6);
  const recommendedCategories = activeCategories.filter((c) => c.is_recommended).slice(0, 4);
  const publishedTemplates = signTemplates.filter((t) => t.is_active && t.status === 'published');
  const popularTemplates = publishedTemplates.filter((t) => t.is_popular).slice(0, 8);
  const sampleShowcases = publishedTemplates.filter((t) => t.is_featured_sample).slice(0, 4);
  const publishedReviews = reviews.filter((r) => r.is_published);

  const handleStartOrderNow = () => {
    setStep(1);
    navigate('/order-wizard');
  };

  const handleChooseCategory = (catId: string) => {
    selectSignCategory(catId, true);
    navigate('/order-wizard');
  };

  const handleChooseTemplate = (tplId: string) => {
    startOrderWithTemplate(tplId);
    navigate('/order-wizard');
  };

  const faqAccents = [
    SITE_DECORATIONS.mascots.mascotHeadBerry,
    SITE_DECORATIONS.mascots.honeyBearBottle,
    SITE_DECORATIONS.sweets.pinkRollCake,
    SITE_DECORATIONS.cafe.cherryMilkCarton,
    SITE_DECORATIONS.mascots.bearPancake,
    SITE_DECORATIONS.sweets.cherryPieTart,
  ];

  return (
    <div className="space-y-16 pb-8">
      {/* 6. Hero Banner Section (PART 5) with Korean Minimal Pastel aesthetic */}
      <section className="relative overflow-hidden border-b border-[#F2DFE7] bg-gradient-to-b from-brand-pink-light/55 via-brand-cream to-white pt-8 pb-14 lg:py-16">
        {/* Dreamy pastel bokeh glow blobs ("แสงฟุ้งพาสเทลแบบนุ่มนวล") */}
        <div
          className="animate-blob-drift pointer-events-none absolute -left-16 -top-16 h-80 w-80 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 192, 218, 0.6) 0%, rgba(255, 228, 210, 0.3) 60%, transparent 78%)',
          }}
        />
        <div
          className="animate-blob-drift-delayed pointer-events-none absolute -right-12 top-6 h-96 w-96 rounded-full opacity-35 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(232, 216, 255, 0.55) 0%, rgba(255, 204, 224, 0.3) 58%, transparent 78%)',
          }}
        />

        {/* Floating hero background accents (subtle corner accents) */}
        <img
          src={SITE_DECORATIONS.sparkles.skyCloudLarge}
          alt=""
          className="animate-float-slow pointer-events-none absolute left-6 top-6 hidden h-10 w-10 object-contain opacity-40 lg:block"
        />
        <img
          src={SITE_DECORATIONS.sparkles.starBurst}
          alt=""
          className="animate-twinkle pointer-events-none absolute right-10 top-6 hidden h-8 w-8 object-contain opacity-45 lg:block"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <div className="dreamy-pill-glow inline-flex items-center gap-2 rounded-full border border-brand-pink/60 bg-white/95 px-4 py-1.5 text-xs font-semibold text-brand-brown shadow-xs">
                <img
                  src={SITE_DECORATIONS.bows.miniBow}
                  alt=""
                  className="animate-wiggle-cute h-4 w-4 object-contain"
                />
                <Sparkles className="h-3.5 w-3.5 text-brand-pink-dark" />
                <span>{siteSettings.hero_banner.badge_text}</span>
              </div>

              <h1 className="text-3xl font-bold leading-tight text-brand-brown sm:text-4xl lg:text-5xl">
                {siteSettings.hero_banner.headline}
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-brand-brown-soft sm:text-lg">
                {siteSettings.hero_banner.subheadline}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleStartOrderNow}
                  className="btn-primary !px-7 !py-4 text-base font-bold shadow-pastel relative group"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>{siteSettings.hero_banner.cta_primary_text || 'เริ่มสั่งทำป้าย'}</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>

                <Link
                  to="/templates"
                  className="btn-secondary !px-6 !py-4 text-base font-semibold"
                >
                  {siteSettings.hero_banner.cta_secondary_text || 'ดูเทมเพลตทั้งหมด'}
                </Link>

                {/* Welcoming Mascot Badge */}
                <div className="dreamy-pill-glow relative inline-flex items-center gap-2.5 rounded-2xl border border-brand-pink/50 bg-white/95 px-3.5 py-2 shadow-xs">
                  <img
                    src={SITE_DECORATIONS.mascots.rabbitCute}
                    alt="Custom Sign Studio Mascot"
                    className="animate-float-slow h-9 w-9 object-contain drop-shadow-xs"
                  />
                  <div>
                    <p className="text-xs font-bold text-brand-brown">สั่งง่าย ทำได้ด้วยตนเอง</p>
                    <p className="text-[11px] text-brand-brown-soft">ไม่ต้องรอแอดมินตอบแชต ✨</p>
                  </div>
                </div>
              </div>

              {/* Trust & Feature Pills — each decorated with a purposeful thematic icon */}
              <div className="grid grid-cols-1 gap-3 pt-4 sm:max-w-xl sm:grid-cols-3">
                {/* Stat 1: Shop Sign Categories -> Iced Bear Cup */}
                <div className="card-pastel card-pastel-hover relative overflow-hidden p-3.5 pr-10 text-left">
                  <img
                    src={SITE_DECORATIONS.cafe.icedBearCup}
                    alt=""
                    className="animate-float-slow pointer-events-none absolute bottom-1.5 right-1.5 h-9 w-9 object-contain opacity-85 drop-shadow-xs"
                  />
                  <p className="text-lg font-bold text-brand-pink-dark">{activeCategories.length}+</p>
                  <p className="text-xs font-medium text-brand-brown-soft">ประเภทป้ายร้านค้า</p>
                </div>

                {/* Stat 2: Free 0 Baht Decorations -> Cute Mascot Donut */}
                <div className="card-pastel card-pastel-hover relative overflow-hidden p-3.5 pr-10 text-left">
                  <img
                    src={SITE_DECORATIONS.mascots.mascotDonut}
                    alt=""
                    className="animate-float-delayed pointer-events-none absolute bottom-1.5 right-1.5 h-9 w-9 object-contain opacity-85 drop-shadow-xs"
                  />
                  <p className="text-lg font-bold text-emerald-700">ฟรี 0 บาท</p>
                  <p className="text-xs font-medium text-brand-brown-soft">
                    ของตกแต่ง ({decorations.length}+ ชิ้น)
                  </p>
                </div>

                {/* Stat 3: Clear Pricing -> Custard Pudding */}
                <div className="card-pastel card-pastel-hover relative overflow-hidden p-3.5 pr-10 text-left">
                  <img
                    src={SITE_DECORATIONS.sweets.custardPuddingSpoon}
                    alt=""
                    className="animate-float-slow pointer-events-none absolute bottom-1.5 right-1.5 h-9 w-9 object-contain opacity-85 drop-shadow-xs"
                  />
                  <p className="text-lg font-bold text-brand-brown">เริ่มต้น 39฿</p>
                  <p className="text-xs font-medium text-brand-brown-soft">คำนวณราคาชัดเจน</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="card-pastel relative p-3.5 sm:p-5">
                {/* Soft glowing pastel halo behind the Hero showcase frame */}
                <div
                  className="animate-pulse-glow pointer-events-none absolute -inset-3 -z-10 rounded-[2rem] opacity-35 blur-xl"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(255, 182, 209, 0.6) 0%, rgba(235, 218, 255, 0.35) 55%, transparent 75%)',
                  }}
                />
                {/* Corner stationery pin & mascot cluster on the Hero showcase frame */}
                <img
                  src={SITE_DECORATIONS.bows.pinkBow}
                  alt=""
                  className="animate-wiggle-cute pointer-events-none absolute -top-2.5 right-6 z-20 h-9 w-9 object-contain drop-shadow-xs"
                />
                <img
                  src={SITE_DECORATIONS.mascots.bearPudding}
                  alt=""
                  className="animate-float-slow pointer-events-none absolute -bottom-2 -left-2 z-20 hidden h-14 w-14 object-contain drop-shadow-sm sm:block"
                />

                <div className="relative overflow-hidden rounded-2xl border border-[#F0E2DA] bg-brand-cream">
                  <img
                    src={siteSettings.hero_banner.banner_image_url || '/placeholders/hero-banner.svg'}
                    alt={siteSettings.branding.shop_name}
                    className="w-full object-cover"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#F2E6DF] bg-brand-cream px-4 py-2.5 text-xs sm:pl-10">
                  <span className="flex items-center gap-1.5 font-semibold text-brand-brown">
                    <Sparkles className="inline h-3.5 w-3.5 text-brand-pink-dark" />
                    เลือกของตกแต่งฟรีได้ไม่จำกัดชิ้นในทุกออเดอร์
                  </span>
                  <Link to="/order-wizard" className="shrink-0 font-bold text-brand-pink-dark underline">
                    ลองจัดออเดอร์เลย →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. หมวดหมู่ป้ายยอดนิยม (Popular Sign Categories) */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <span className="badge-pastel bg-brand-pink-light text-brand-pink-dark">
              <Layers className="h-3.5 w-3.5" /> หมวดหมู่ป้ายยอดนิยม
              <img src={SITE_DECORATIONS.bows.miniBow} alt="" className="h-4 w-4 object-contain" />
            </span>
            <h2 className="mt-2 text-2xl font-bold text-brand-brown sm:text-3xl">
              เลือกประเภทป้ายที่ต้องการสั่งทำ
            </h2>
            <p className="text-sm text-brand-brown-soft">
              ครบทุกป้ายสำหรับร้านค้าออนไลน์และโซเชียลมีเดีย คลิกเลือกเพื่อเริ่มสั่งทำได้ทันที
            </p>
          </div>
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-pink-dark hover:underline"
          >
            ดูประเภทป้ายทั้งหมด ({activeCategories.length} รายการ) <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {popularCategories.map((cat, idx) => {
            const preset = CATEGORY_DECOR_PRESETS[idx % CATEGORY_DECOR_PRESETS.length];
            return (
              <div
                key={cat.id}
                className="card-pastel card-pastel-hover group relative flex flex-col overflow-hidden"
              >
                <div className="relative aspect-[16/11] overflow-hidden bg-brand-cream p-3">
                  <img
                    src={cat.preview_image_url}
                    alt={cat.name}
                    className="h-full w-full rounded-2xl object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                  <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-brown shadow-sm">
                    <img src={preset.pin} alt="" className="h-3.5 w-3.5 object-contain" />
                    เริ่มต้น {formatTHB(cat.base_price)}
                  </span>
                  {cat.is_demo && (
                    <span className="absolute right-5 top-5 rounded-full bg-brand-pink-light/95 px-2.5 py-0.5 text-[11px] font-semibold text-brand-pink-dark">
                      Placeholder
                    </span>
                  )}
                  {/* Corner sweet/mascot sticker on preview frame */}
                  <img
                    src={preset.primary}
                    alt=""
                    className="animate-float-slow pointer-events-none absolute bottom-4 right-4 h-12 w-12 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="relative flex flex-1 flex-col justify-between p-5">
                  <div className="pr-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-brown-soft">
                      <span>{cat.group_name}</span>
                      <span>•</span>
                      <span className="text-[11px] font-semibold text-brand-pink-dark">{preset.themeLabel}</span>
                    </span>
                    <h3 className="mt-1 text-lg font-bold text-brand-brown transition group-hover:text-brand-pink-dark">
                      {cat.name}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-sm text-brand-brown-soft">
                      {cat.short_description}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-[#F2E6DF] pt-4">
                    <div>
                      <span className="block text-xs text-brand-brown-soft">ราคาเริ่มต้น</span>
                      <span className="text-base font-bold text-brand-pink-dark">
                        {formatTHB(cat.base_price)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChooseCategory(cat.id)}
                      className="btn-primary !px-4 !py-2.5 text-sm"
                    >
                      เลือกป้ายนี้
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. สินค้าแนะนำ & เปรียบเทียบ 2 สไตล์หลัก (Minimal vs Decorative) */}
      <section className="border-y border-[#EFE2D9] bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 text-center">
            <span className="badge-pastel bg-brand-pink-light text-brand-pink-dark">
              <Sparkles className="h-3.5 w-3.5" /> สไตล์งานออกแบบ &amp; สินค้าแนะนำ
              <img src={SITE_DECORATIONS.sweets.miniHeart} alt="" className="h-3.5 w-3.5 object-contain" />
            </span>
            <h2 className="mt-2 text-2xl font-bold text-brand-brown sm:text-3xl">
              เลือกสไตล์ที่ใช่สำหรับแบรนด์ของคุณ
            </h2>
            <p className="mx-auto mt-1 max-w-2xl text-sm text-brand-brown-soft">
              ทั้ง 2 สไตล์สามารถเลือกของตกแต่งพาสเทล (โบว์ ดอกไม้ หัวใจ ดาว ฯลฯ) เพิ่มได้ฟรี 0 บาททุกชิ้น!
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {signStyles
              .filter((s) => s.is_active)
              .map((style) => {
                const isMinimal = style.code === 'MIN';
                const mainSticker = isMinimal
                  ? SITE_DECORATIONS.mascots.mascotToast
                  : SITE_DECORATIONS.sweets.pancakeTower;

                return (
                  <div
                    key={style.id}
                    className="card-pastel group relative flex flex-col justify-between overflow-hidden border-2 border-[#EFE2D9] p-6 transition duration-200 hover:border-brand-pink hover:shadow-pastel-lg"
                  >
                    <div>
                      <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-2xl bg-brand-cream">
                        <img
                          src={style.preview_image_url}
                          alt={style.name}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute right-4 top-4 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-brand-pink-dark shadow-sm">
                          {style.price_modifier === 0
                            ? 'ไม่บวกราคาเพิ่ม (+0 บาท)'
                            : `เพิ่มเพียง +${formatTHB(style.price_modifier)}`}
                        </span>
                        <img
                          src={mainSticker}
                          alt=""
                          className="animate-float-slow pointer-events-none absolute bottom-3 left-3 h-12 w-12 object-contain drop-shadow-md"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-brand-brown">{style.name}</h3>
                      </div>
                      <p className="mt-1 text-sm font-medium text-brand-pink-dark">{style.tagline}</p>
                      <p className="mt-2 text-sm text-brand-brown-soft">{style.description}</p>
                      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {style.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs font-medium text-brand-brown">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-[#F2E6DF] pt-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                        <img
                          src={SITE_DECORATIONS.mascots.rabbitCute}
                          alt=""
                          className="h-4 w-4 object-contain"
                        />
                        แถมของตกแต่งฟรีทุกชิ้น (0 บาท)
                      </span>
                      <Link
                        to={`/templates?style=${style.id}`}
                        className="btn-soft text-xs font-bold"
                      >
                        ดูเทมเพลตสไตล์ {style.code} →
                      </Link>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Recommended Sign Packages — each card decorated with its own purposeful preset */}
          <div className="mt-10">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-brown">
              <img src={SITE_DECORATIONS.bows.pinkBow} alt="" className="animate-wiggle-cute h-6 w-6 object-contain" />
              <span>ป้ายแนะนำขายดีสำหรับแม่ค้าออนไลน์มือใหม่</span>
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recommendedCategories.map((cat, idx) => {
                const pkgPreset = PACKAGE_DECOR_PRESETS[idx % PACKAGE_DECOR_PRESETS.length];
                return (
                  <div
                    key={cat.id}
                    className="card-pastel card-pastel-hover group relative flex flex-col justify-between overflow-hidden p-5"
                  >
                    <CardStickerDecor
                      preset={pkgPreset}
                      primaryPosition="top-right"
                      size="md"
                    />
                    <div className="relative z-10">
                      <div className="pr-14">
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-pink-light px-2.5 py-0.5 text-[11px] font-bold text-brand-pink-dark">
                          แนะนำ • {pkgPreset.themeLabel}
                        </span>
                        <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
                          <h4 className="font-bold text-brand-brown">{cat.name}</h4>
                          <span className="rounded-full bg-brand-pink-light/70 px-2.5 py-0.5 text-xs font-bold text-brand-pink-dark">
                            {formatTHB(cat.base_price)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-brand-brown-soft">
                        {cat.short_description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChooseCategory(cat.id)}
                      className="relative z-10 mt-4 w-full rounded-xl border border-[#EAD9CE] bg-brand-cream py-2.5 text-xs font-bold text-brand-brown shadow-2xs transition hover:border-brand-pink-dark hover:bg-brand-pink-dark hover:text-white"
                    >
                      สั่งทำ{cat.name}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 9. เทมเพลตยอดนิยม (Popular Templates Gallery) */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <span className="badge-pastel bg-brand-pink-light text-brand-pink-dark">
              <Gift className="h-3.5 w-3.5" /> เทมเพลตยอดนิยม
              <img src={SITE_DECORATIONS.sparkles.starMini} alt="" className="h-3.5 w-3.5 object-contain" />
            </span>
            <h2 className="mt-2 text-2xl font-bold text-brand-brown sm:text-3xl">
              เทมเพลตป้ายสำเร็จรูปพร้อมใช้งาน
            </h2>
            <p className="text-sm text-brand-brown-soft">
              คลิกดูภาพขนาดใหญ่ หรือกดเลือกเทมเพลตเพื่อไปเลือกของตกแต่งฟรีและกรอกข้อความต่อได้เลย
            </p>
          </div>
          <Link
            to="/templates"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-pink-dark hover:underline"
          >
            เปิดแกลเลอรีเทมเพลตทั้งหมด ({publishedTemplates.length} แบบ) <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {popularTemplates.map((tpl, idx) => {
            const cat = signCategories.find((c) => c.id === tpl.sign_category_id);
            const style = signStyles.find((s) => s.id === tpl.style_id);
            const totalPrice =
              (tpl.base_price_override ?? cat?.base_price ?? 59) + (style?.price_modifier ?? 0);
            const isFav = favorites.includes(tpl.id);
            const accent = TEMPLATE_CARD_ACCENTS[idx % TEMPLATE_CARD_ACCENTS.length];

            return (
              <div
                key={tpl.id}
                className="card-pastel card-pastel-hover group relative flex flex-col overflow-hidden"
              >
                <div className="relative aspect-[4/5] bg-brand-cream p-3">
                  <img
                    src={tpl.preview_image_url}
                    alt={tpl.name}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                  <span className="absolute left-5 top-5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-brand-brown shadow-sm">
                    <img src={accent.corner} alt="" className="h-3.5 w-3.5 object-contain" />
                    {tpl.code}
                  </span>
                  <div className="absolute right-5 top-5 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => void toggleFavorite(tpl.id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition ${
                        isFav ? 'bg-brand-pink-dark text-white' : 'bg-white/90 text-brand-brown hover:bg-brand-pink-light'
                      }`}
                      title="บันทึกรายการโปรด"
                    >
                      <Heart className="h-4 w-4" fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(tpl)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-brown shadow-sm transition hover:bg-brand-pink-light"
                      title="ดูภาพขนาดใหญ่"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Subtle sweet sticker on bottom-right of template preview */}
                  <img
                    src={accent.badge}
                    alt=""
                    className="animate-float-slow pointer-events-none absolute bottom-4 right-4 h-9 w-9 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                <div className="relative flex flex-1 flex-col justify-between p-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-brand-brown-soft">
                      <span>{cat?.name}</span>
                      <span className="font-semibold text-brand-pink-dark">{style?.code}</span>
                    </div>
                    <Link
                      to={`/templates/${tpl.code}`}
                      className="mt-1 block font-bold text-brand-brown hover:text-brand-pink-dark"
                    >
                      {tpl.name}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs text-brand-brown-soft">
                      {tpl.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#F2E6DF] pt-3">
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-pink-dark">
                      {formatTHB(totalPrice)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleChooseTemplate(tpl.id)}
                      className="btn-primary !px-3.5 !py-2 text-xs"
                    >
                      เลือกเทมเพลตนี้
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. ผลงานตัวอย่าง & ไฮไลต์ของตกแต่งฟรี 9 หมวดสี (Sample Showcase & Free Decorations) */}
      <section className="relative mx-auto max-w-7xl px-4">
        <div className="card-pastel relative overflow-hidden bg-gradient-to-br from-white via-brand-cream to-brand-pink-light/30 p-6 sm:p-10">
          {/* Soft glowing pastel bokeh orbs behind the showcase */}
          <div
            className="animate-pulse-glow pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full opacity-75 blur-2xl"
            style={{
              background:
                'radial-gradient(circle, rgba(255, 192, 218, 0.78) 0%, rgba(235, 220, 255, 0.45) 60%, transparent 78%)',
            }}
          />
          {/* Corner stationery pins & mascots for the Free 0-Baht Showcase Frame */}
          <img
            src={SITE_DECORATIONS.bows.pinkBow}
            alt=""
            className="animate-wiggle-cute pointer-events-none absolute right-6 top-3 h-10 w-10 object-contain opacity-95"
          />
          <img
            src={SITE_DECORATIONS.mascots.bearPudding}
            alt=""
            className="animate-float-slow pointer-events-none absolute bottom-3 right-4 hidden h-16 w-16 object-contain opacity-95 lg:block"
          />
          <img
            src={SITE_DECORATIONS.sparkles.starBurst}
            alt=""
            className="animate-twinkle pointer-events-none absolute bottom-4 left-4 h-7 w-7 object-contain opacity-85"
          />

          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              <span className="badge-pastel inline-flex items-center gap-1.5 bg-emerald-100 font-bold text-emerald-800">
                <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                ฟรีทุกชิ้น 0 บาท ไม่มีบวกเพิ่ม
              </span>
              <h2 className="text-2xl font-bold text-brand-brown sm:text-3xl">
                คลังของตกแต่งพาสเทล 9 โทนสี เลือกผสมได้ไม่อั้น!
              </h2>
              <p className="text-sm leading-relaxed text-brand-brown-soft">
                ไม่ว่าคุณจะเลือกสไตล์ Minimal หรือ Decorative ก็สามารถเลือกของตกแต่งเพิ่มได้ฟรีทุกชิ้น
                ทั้งโบว์ ดอกไม้ หัวใจ ดาว สติกเกอร์ กรอบ พื้นหลัง ประกายวิบวับ ไอคอน และเส้นคั่น
              </p>

              {/* Anchored illustration cluster supporting the free-decoration message */}
              <div className="rounded-2xl border border-brand-pink/30 bg-white/90 p-3.5 shadow-2xs sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold text-brand-brown">
                      <Gift className="h-3.5 w-3.5 text-brand-pink-dark" /> จัดวางให้เข้ากับโทนร้าน
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-brand-brown-soft">
                      โบว์ มาสคอต และขนมหวานช่วยเติมบรรยากาศน่ารัก โดยไม่แย่งความเด่นจากข้อความบนป้าย
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-cream px-4 py-2">
                    <img src={SITE_DECORATIONS.bows.pinkBow} alt="" className="h-8 w-8 object-contain" />
                    <img src={SITE_DECORATIONS.sweets.miniPudding} alt="" className="h-10 w-10 object-contain" />
                    <img src={SITE_DECORATIONS.mascots.mascotBerryFace} alt="" className="h-8 w-8 object-contain" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {decorationColors.map((col) => (
                  <span
                    key={col.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#EAD9CE] bg-white px-3 py-1 text-xs font-medium text-brand-brown"
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-black/10"
                      style={{ backgroundColor: col.hex_code }}
                    />
                    {col.name}
                  </span>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartOrderNow}
                  className="btn-primary text-sm"
                >
                  ไปทดลองเลือกของตกแต่งฟรีใน Wizard →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:col-span-7">
              {sampleShowcases.map((sample, sIdx) => {
                const sampleAccent = TEMPLATE_CARD_ACCENTS[sIdx % TEMPLATE_CARD_ACCENTS.length];
                return (
                  <div
                    key={sample.id}
                    onClick={() => setPreviewTemplate(sample)}
                    className="card-pastel group relative cursor-pointer p-2.5 transition hover:-translate-y-1 hover:border-brand-pink"
                  >
                    <img
                      src={sampleAccent.corner}
                      alt=""
                      className="pointer-events-none absolute right-2 top-2 z-10 h-5 w-5 object-contain drop-shadow-xs"
                    />
                    <img
                      src={sample.preview_image_url}
                      alt={sample.name}
                      className="aspect-[4/5] w-full rounded-xl object-cover"
                    />
                    <p className="mt-2 truncate text-center text-xs font-bold text-brand-brown">
                      {sample.code} • {sample.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 11. วิธีสั่งทำป้าย (How to Order) & 12. จุดเด่นของร้าน (Highlights) */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="badge-pastel bg-brand-pink-light text-brand-pink-dark">
              <Clock className="h-3.5 w-3.5" /> วิธีสั่งทำป้ายง่าย ๆ
              <img src={SITE_DECORATIONS.mascots.toastEggSmile} alt="" className="h-4 w-4 object-contain" />
            </span>
            <h2 className="mt-2 text-2xl font-bold text-brand-brown">
              สั่งทำป้ายเสร็จใน 4 ขั้นตอน ไม่ต้องรอแอดมินตอบแชต
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {siteSettings.how_to_order.map((step, idx) => {
                const stepPreset = STEP_DECOR_PRESETS[idx % STEP_DECOR_PRESETS.length];
                return (
                  <div key={step.step} className="card-pastel group relative overflow-hidden p-5">
                    <CardStickerDecor
                      preset={stepPreset}
                      primaryPosition="top-right"
                      size="md"
                      showThemeBadge
                    />
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-pink-dark text-sm font-bold text-white shadow-xs">
                      {step.step}
                    </div>
                    <h3 className="mt-3 pr-14 font-bold text-brand-brown">{step.title}</h3>
                    <p className="mt-1 pr-6 text-xs leading-relaxed text-brand-brown-soft">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5">
            <span className="badge-pastel bg-brand-pink-light text-brand-pink-dark">
              <ShieldCheck className="h-3.5 w-3.5" /> จุดเด่นของร้านเรา
              <img src={SITE_DECORATIONS.bows.miniBow} alt="" className="h-4 w-4 object-contain" />
            </span>
            <h2 className="mt-2 text-2xl font-bold text-brand-brown">
              ทำไมแม่ค้าออนไลน์ถึงเลือก {siteSettings.branding.shop_name}
            </h2>
            <div className="mt-6 space-y-3">
              {siteSettings.highlights.map((hl, i) => (
                <div
                  key={i}
                  className="card-pastel group relative flex items-start gap-3.5 p-4 transition hover:border-brand-pink"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-pink-light text-brand-pink-dark">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-brown">{hl.title}</h3>
                    <p className="mt-0.5 text-xs text-brand-brown-soft">{hl.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 13. รีวิวลูกค้า (Customer Reviews — clearly labeled if Demo per PART 20) */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <span className="badge-pastel bg-brand-pink-light text-brand-pink-dark">
              <Star className="h-3.5 w-3.5" /> รีวิวและความประทับใจ
              <img src={SITE_DECORATIONS.sweets.miniHeart} alt="" className="h-3.5 w-3.5 object-contain" />
            </span>
            <h2 className="mt-2 text-2xl font-bold text-brand-brown">
              เสียงตอบรับการสั่งทำป้ายออนไลน์
            </h2>
          </div>
          <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
            หมายเหตุ: รายการที่มีป้าย <strong>[รีวิวตัวอย่าง Demo]</strong> เป็นข้อมูลสาธิตระบบ (สามารถลบออกได้จากหลังบ้าน)
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {publishedReviews.slice(0, 3).map((rev, idx) => {
            const revPreset = REVIEW_DECOR_PRESETS[idx % REVIEW_DECOR_PRESETS.length];
            return (
              <div
                key={rev.id}
                className="card-pastel card-pastel-hover group relative flex flex-col justify-between overflow-hidden p-5"
              >
                <CardStickerDecor
                  preset={revPreset}
                  primaryPosition="top-right"
                  size="sm"
                />
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-2 pr-14">
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, starIdx) => (
                        <Star key={starIdx} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    {rev.is_demo ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                        รีวิวตัวอย่าง Demo
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        ลูกค้าจริง
                      </span>
                    )}
                  </div>
                  <p className="mt-3 pr-4 text-sm leading-relaxed text-brand-brown">{rev.comment}</p>
                </div>
                <div className="relative z-10 mt-4 flex items-center justify-between border-t border-[#F2E6DF] pt-3 text-xs">
                  <span className="font-bold text-brand-brown">{rev.customer_name}</span>
                  <span className="text-brand-brown-soft">
                    {rev.sign_type_name} • {rev.style_name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 14. FAQ & 15. ช่องทางติดต่อ (FAQ & Contact Banner) */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-brand-brown">
                <HelpCircle className="h-6 w-6 text-brand-pink-dark" /> คำถามที่พบบ่อย (FAQ)
                <img
                  src={SITE_DECORATIONS.mascots.mascotHeadBerry}
                  alt=""
                  className="h-7 w-7 object-contain"
                />
              </h2>
              <Link to="/faq" className="text-xs font-bold text-brand-pink-dark hover:underline">
                ดูทั้งหมด →
              </Link>
            </div>
            <div className="space-y-3">
              {siteSettings.faq_list.map((faq, idx) => (
                <div key={idx} className="card-pastel card-pastel-hover p-4 sm:p-5">
                  <h3 className="font-bold text-brand-brown">Q: {faq.question}</h3>
                  <p className="mt-1.5 text-sm text-brand-brown-soft">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="card-pastel relative flex h-full flex-col justify-between overflow-hidden bg-brand-pink-light/50 p-6 sm:p-8">
              <div
                className="animate-pulse-glow pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full opacity-35 blur-xl"
                style={{
                  background:
                    'radial-gradient(circle, rgba(255, 186, 214, 0.7) 0%, transparent 75%)',
                }}
              />
              {/* Corner welcoming mascot & bow on the Contact CTA card */}
              <img
                src={SITE_DECORATIONS.bows.pinkBow}
                alt=""
                className="animate-wiggle-cute pointer-events-none absolute right-5 top-3 h-8 w-8 object-contain drop-shadow-xs"
              />
              <img
                src={SITE_DECORATIONS.mascots.bearPudding}
                alt=""
                className="animate-float-slow pointer-events-none absolute bottom-12 right-4 hidden h-12 w-12 object-contain opacity-90 drop-shadow-sm sm:block"
              />

              <div className="relative z-10 space-y-4">
                <span className="badge-pastel bg-white text-brand-pink-dark">
                  <MessageCircle className="h-3.5 w-3.5" /> ช่องทางติดต่อร้าน
                </span>
                <h3 className="pr-8 text-2xl font-bold text-brand-brown">
                  พร้อมเริ่มสั่งทำป้ายร้านค้าของคุณหรือยังคะ?
                </h3>
                <p className="text-sm text-brand-brown-soft">
                  คุณสามารถกดสั่งทำป้ายผ่านหน้าเว็บได้ทันทีตลอด 24 ชั่วโมง หรือติดต่อสอบถามข้อมูลเพิ่มเติมตามช่องทางด้านล่าง
                </p>
                <div className="relative space-y-2 rounded-2xl border border-[#F0E2DA] bg-white/95 p-4 text-sm shadow-2xs">
                  <p>
                    <strong>LINE Official:</strong> {siteSettings.contact_footer.line_id}
                  </p>
                  <p>
                    <strong>Instagram:</strong> {siteSettings.contact_footer.instagram}
                  </p>
                  <p>
                    <strong>Facebook:</strong> {siteSettings.contact_footer.facebook}
                  </p>
                  <p>
                    <strong>เวลาทำการ:</strong> {siteSettings.contact_footer.working_hours}
                  </p>
                </div>
              </div>

              <div className="relative z-10 mt-6 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={handleStartOrderNow}
                  className="btn-primary flex-1"
                >
                  <Sparkles className="h-4 w-4" /> เริ่มสั่งทำป้ายทันที
                </button>
                <Link to="/contact" className="btn-secondary">
                  หน้าติดต่อเรา
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal for Template Preview */}
      {previewTemplate && (
        <ImageLightboxModal
          isOpen={Boolean(previewTemplate)}
          onClose={() => setPreviewTemplate(null)}
          imageUrl={previewTemplate.preview_image_url}
          title={previewTemplate.name}
          code={previewTemplate.code}
          subtitle={
            signCategories.find((c) => c.id === previewTemplate.sign_category_id)?.name
          }
          description={previewTemplate.description}
          priceLabel={
            (previewTemplate.base_price_override ??
              signCategories.find((c) => c.id === previewTemplate.sign_category_id)?.base_price ??
              59) +
            (signStyles.find((s) => s.id === previewTemplate.style_id)?.price_modifier ?? 0)
          }
          onSelect={() => handleChooseTemplate(previewTemplate.id)}
        />
      )}
    </div>
  );
};
