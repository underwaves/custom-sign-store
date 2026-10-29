import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, Sparkles, Eye, Gift } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useOrderWizard } from '@/context/OrderWizardContext';
import { formatTHB } from '@/utils/pricing';
import { ImageLightboxModal } from '@/components/common/ImageLightboxModal';
import { SITE_DECORATIONS } from '@/data/siteDecorations';

export const TemplateDetailsPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const {
    signTemplates,
    signCategories,
    signStyles,
    decorations,
    productFields,
    favorites,
    toggleFavorite,
  } = useStore();
  const { startOrderWithTemplate } = useOrderWizard();
  const navigate = useNavigate();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const template = signTemplates.find(
    (t) => t.code.toUpperCase() === (code ?? '').toUpperCase() || t.id === code
  );

  if (!template) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="card-pastel relative overflow-hidden p-10">
          <img
            src={SITE_DECORATIONS.mascots.mascotHeadBerry}
            alt=""
            className="mx-auto mb-3 h-16 w-16 object-contain"
          />
          <h1 className="text-2xl font-bold text-brand-brown">ไม่พบข้อมูลเทมเพลตที่ค้นหา</h1>
          <p className="mt-2 text-sm text-brand-brown-soft">
            เทมเพลตนี้อาจถูกย้ายหรือปิดใช้งานชั่วคราว
          </p>
          <Link to="/templates" className="btn-primary mt-6 inline-flex">
            กลับไปหน้าแกลเลอรีเทมเพลต
          </Link>
        </div>
      </div>
    );
  }

  const category = signCategories.find((c) => c.id === template.sign_category_id);
  const style = signStyles.find((s) => s.id === template.style_id);
  const fields = productFields.filter(
    (f) => f.sign_category_id === template.sign_category_id && f.is_active
  );
  const basePrice = template.base_price_override ?? category?.base_price ?? 59;
  const styleModifier = style?.price_modifier ?? 0;
  const totalPrice = basePrice + styleModifier;
  const isFav = favorites.includes(template.id);
  const isMinimal = style?.code === 'MIN';

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <Link
        to="/templates"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-brown hover:text-brand-pink-dark"
      >
        <ArrowLeft className="h-4 w-4" /> กลับไปหน้าแกลเลอรีเทมเพลต
      </Link>

      <div className="card-pastel relative overflow-hidden p-6 sm:p-8">
        {/* Corner stationery bow & sparkle accents on main template frame */}
        <img
          src={SITE_DECORATIONS.bows.pinkBow}
          alt=""
          className="pointer-events-none absolute right-6 top-3 h-10 w-10 rotate-6 object-contain drop-shadow-xs"
        />
        <img
          src={SITE_DECORATIONS.sparkles.starBurst}
          alt=""
          className="pointer-events-none absolute bottom-4 left-4 h-7 w-7 object-contain opacity-75"
        />

        <div className="relative z-10 grid gap-8 md:grid-cols-12">
          {/* Left: Template Preview with contextual style sticker */}
          <div className="md:col-span-5">
            <div className="relative rounded-3xl border border-[#F0E2DA] bg-brand-cream p-4">
              <img
                src={SITE_DECORATIONS.bows.miniBow}
                alt=""
                className="pointer-events-none absolute left-6 top-6 z-10 h-6 w-6 -rotate-6 object-contain drop-shadow-xs"
              />
              <img
                src={
                  isMinimal
                    ? SITE_DECORATIONS.mascots.mascotToast
                    : SITE_DECORATIONS.sweets.pancakeTower
                }
                alt=""
                className="pointer-events-none absolute bottom-16 right-6 z-10 h-14 w-14 rotate-3 object-contain drop-shadow-md"
              />
              <img
                src={template.preview_image_url}
                alt={template.name}
                className="w-full rounded-2xl object-cover shadow-sm"
              />
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-2.5 text-xs font-bold text-brand-brown shadow-sm hover:bg-brand-pink-light"
              >
                <Eye className="h-4 w-4 text-brand-pink-dark" /> คลิกเพื่อขยายดูภาพขนาดใหญ่
              </button>
            </div>
          </div>

          {/* Right: Details & Pricing Breakdown */}
          <div className="flex flex-col justify-between space-y-6 md:col-span-7">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 pr-10">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-pink-light px-3 py-1 text-xs font-bold text-brand-pink-dark">
                  <img src={SITE_DECORATIONS.badges.stampSquare} alt="" className="h-3.5 w-3.5 object-contain" />
                  รหัสเทมเพลต: {template.code}
                </span>
                <span className="rounded-full border border-[#EAD9CE] bg-brand-cream px-3 py-1 text-xs font-semibold text-brand-brown">
                  ประเภท: {category?.name}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  สไตล์: {style?.name}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-brand-brown sm:text-3xl">{template.name}</h1>
              <p className="text-sm leading-relaxed text-brand-brown-soft">{template.description}</p>

              {/* Price Calculation Card with Pudding Accent */}
              <div className="relative space-y-2 overflow-hidden rounded-2xl border border-[#EAD9CE] bg-brand-cream p-5 pr-16 text-sm">
                <img
                  src={SITE_DECORATIONS.sweets.custardPuddingSpoon}
                  alt=""
                  className="pointer-events-none absolute right-3 top-3 h-12 w-12 object-contain opacity-95"
                />
                <div className="flex justify-between">
                  <span className="text-brand-brown-soft">ราคาฐาน ({category?.name}):</span>
                  <span className="font-semibold text-brand-brown">{formatTHB(basePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-brown-soft">ราคาเพิ่มสไตล์ ({style?.code}):</span>
                  <span className="font-semibold text-brand-brown">+{formatTHB(styleModifier)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>ของตกแต่งพาสเทล ({decorations.length}+ รายการ):</span>
                  <span className="font-bold">ฟรี 0 บาททุกชิ้น</span>
                </div>
                <div className="flex justify-between border-t border-[#E6D7CD] pt-2.5 text-base font-bold">
                  <span className="text-brand-brown">ราคารวมต่อป้าย:</span>
                  <span className="text-brand-pink-dark">{formatTHB(totalPrice)}</span>
                </div>
              </div>

              {/* Dynamic Fields Preview */}
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-brand-brown">
                  <img src={SITE_DECORATIONS.mascots.honeyBearBottle} alt="" className="h-5 w-5 object-contain" />
                  ข้อมูลที่ลูกค้าจะต้องกรอกสำหรับป้ายประเภทนี้:
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {fields.map((f) => (
                    <span
                      key={f.id}
                      className="rounded-xl border border-[#EAD9CE] bg-white px-3 py-1.5 text-xs text-brand-brown"
                    >
                      {f.label}{' '}
                      {f.is_required ? (
                        <strong className="text-rose-600">*จำเป็น</strong>
                      ) : (
                        <span className="text-brand-brown-soft">(เสริม)</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 pr-14 text-xs text-emerald-900">
                <Gift className="h-5 w-5 shrink-0 text-emerald-700" />
                <span>
                  เมื่อคลิกเลือกเทมเพลตนี้ ระบบจะพาไปขั้นตอนที่ 4 เพื่อเลือกของตกแต่งฟรี (โบว์ ดอกไม้ หัวใจ ดาว ฯลฯ) ได้ตามใจชอบโดยไม่เสียค่าใช้จ่ายเพิ่ม
                </span>
                <img
                  src={SITE_DECORATIONS.mascots.rabbitCute}
                  alt=""
                  className="pointer-events-none absolute right-2.5 top-2 h-11 w-11 object-contain"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  startOrderWithTemplate(template.id);
                  navigate('/order-wizard');
                }}
                className="btn-primary flex-1 !py-3.5 text-base font-bold"
              >
                <Sparkles className="h-5 w-5" />
                <span>ใช้เทมเพลตนี้สั่งทำป้าย ({formatTHB(totalPrice)})</span>
              </button>

              <button
                type="button"
                onClick={() => void toggleFavorite(template.id)}
                className="btn-secondary !px-5"
              >
                <Heart
                  className="h-5 w-5 text-brand-pink-dark"
                  fill={isFav ? 'currentColor' : 'none'}
                />
                <span>{isFav ? 'บันทึกแล้ว' : 'เก็บไว้ดู'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ImageLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        imageUrl={template.preview_image_url}
        title={template.name}
        code={template.code}
        subtitle={category?.name}
        description={template.description}
        priceLabel={totalPrice}
        onSelect={() => {
          startOrderWithTemplate(template.id);
          navigate('/order-wizard');
        }}
      />
    </div>
  );
};
