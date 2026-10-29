import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, Gift, Search, Tag } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useOrderWizard } from '@/context/OrderWizardContext';
import { formatTHB } from '@/utils/pricing';
import { SectionHeaderBannerDecor } from '@/components/common/CardFrameDecoration';
import { SITE_DECORATIONS, CATEGORY_DECOR_PRESETS } from '@/data/siteDecorations';

export const ProductListingPage: React.FC = () => {
  const { signCategories, signStyles, promotions } = useStore();
  const { selectSignCategory, selectStyle } = useOrderWizard();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [selectedStyleCode, setSelectedStyleCode] = useState<'ALL' | 'MIN' | 'DEC'>('ALL');

  const minimalStyle = signStyles.find((s) => s.code === 'MIN') ?? signStyles[0];
  const decorativeStyle = signStyles.find((s) => s.code === 'DEC') ?? signStyles[1];

  const activeCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return signCategories
      .filter((c) => c.is_active)
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.short_description.toLowerCase().includes(q) ||
          c.group_name.toLowerCase().includes(q)
      )
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [signCategories, query]);

  const handleOrderWithStyle = (categoryId: string, styleId: string) => {
    selectSignCategory(categoryId, false);
    selectStyle(styleId, true);
    navigate('/order-wizard');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10">
      {/* Header & Pricing Formula Explanation */}
      <div className="card-pastel relative overflow-hidden p-6 sm:p-8">
        <SectionHeaderBannerDecor
          leftMascot={SITE_DECORATIONS.mascots.honeyBearBottle}
          rightSweet={SITE_DECORATIONS.sweets.custardPuddingSpoon}
          topBow={SITE_DECORATIONS.bows.pinkBow}
        />

        <div className="relative z-10 grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="space-y-2 lg:col-span-7">
            <span className="badge-pastel bg-brand-pink-light text-brand-pink-dark">
              <Sparkles className="h-3.5 w-3.5" /> รายการป้าย &amp; ตารางเรทราคาโปร่งใส
              <img src={SITE_DECORATIONS.bows.miniBow} alt="" className="h-4 w-4 object-contain" />
            </span>
            <h1 className="text-2xl font-bold text-brand-brown sm:text-3xl">
              เปรียบเทียบราคาป้ายแต่ละประเภทตามสไตล์
            </h1>
            <p className="text-sm text-brand-brown-soft">
              สูตรคำนวณราคา: <strong>ราคาฐานของประเภทป้าย + ราคาเพิ่มของสไตล์ + ของตกแต่งฟรี 0 บาททุกชิ้น</strong>
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="relative space-y-1.5 rounded-2xl border border-[#EAD9CE] bg-brand-cream p-4 pr-14 text-xs">
              <img
                src={SITE_DECORATIONS.mascots.rabbitCute}
                alt=""
                className="pointer-events-none absolute right-2.5 top-2.5 h-12 w-12 object-contain"
              />
              <p className="flex items-center gap-1.5 font-bold text-brand-brown">
                <Gift className="h-4 w-4 text-emerald-600" /> สิทธิพิเศษสำหรับทุกออเดอร์:
              </p>
              <p className="text-brand-brown-soft">
                • สไตล์ <strong>Minimal</strong>: ราคาเพิ่ม +{formatTHB(minimalStyle?.price_modifier ?? 0)}
              </p>
              <p className="text-brand-brown-soft">
                • สไตล์ <strong>Decorative</strong>: ราคาเพิ่ม +{formatTHB(decorativeStyle?.price_modifier ?? 20)}
              </p>
              <p className="font-semibold text-emerald-700">
                • ของตกแต่งพาสเทล (โบว์ ดอกไม้ หัวใจ ดาว ฯลฯ): ฟรี 0 บาท ไม่จำกัดจำนวนชิ้น!
              </p>
            </div>
          </div>
        </div>

        {/* Active Promotions Strip */}
        {promotions.filter((p) => p.is_active).length > 0 && (
          <div className="relative z-10 mt-6 flex flex-wrap items-center gap-2 border-t border-[#F2E6DF] pt-4">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-pink-dark">
              <Tag className="h-3.5 w-3.5" /> โค้ดส่วนลดที่ใช้ได้ตอนนี้:
            </span>
            {promotions
              .filter((p) => p.is_active)
              .map((promo) => (
                <span
                  key={promo.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-pink bg-brand-pink-light/60 px-3 py-1 text-xs font-medium text-brand-brown"
                >
                  <img src={SITE_DECORATIONS.sweets.miniHeart} alt="" className="h-3.5 w-3.5 object-contain" />
                  <strong>{promo.code}</strong> — {promo.title} ({promo.description})
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'MIN', 'DEC'] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setSelectedStyleCode(code)}
              className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
                selectedStyleCode === code
                  ? 'bg-brand-pink-dark text-white'
                  : 'border border-[#EAD9CE] bg-white text-brand-brown'
              }`}
            >
              {code === 'ALL'
                ? 'แสดงราคาทั้ง 2 สไตล์'
                : code === 'MIN'
                ? 'เน้นสไตล์ Minimal (+0฿)'
                : `เน้นสไตล์ Decorative (+${decorativeStyle?.price_modifier ?? 20}฿)`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหารายการป้าย..."
            className="input-pastel !py-2.5 pl-10 text-sm"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-brand-brown-soft" />
        </div>
      </div>

      {/* Product Cards with Direct Style Selection */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {activeCategories.map((cat, idx) => {
          const minPrice = cat.base_price + (minimalStyle?.price_modifier ?? 0);
          const decPrice = cat.base_price + (decorativeStyle?.price_modifier ?? 20);
          const preset = CATEGORY_DECOR_PRESETS[idx % CATEGORY_DECOR_PRESETS.length];

          return (
            <div
              key={cat.id}
              className="card-pastel card-pastel-hover group relative flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="relative aspect-[16/10] bg-brand-cream p-3">
                  <img
                    src={cat.preview_image_url}
                    alt={cat.name}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                  <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-brown shadow-xs">
                    <img src={preset.pin} alt="" className="h-3.5 w-3.5 object-contain" />
                    {cat.group_name}
                  </span>
                  <img
                    src={preset.primary}
                    alt=""
                    className="pointer-events-none absolute bottom-4 right-4 h-11 w-11 rotate-3 object-contain drop-shadow-md transition-transform group-hover:scale-110"
                  />
                </div>

                <div className="relative p-5">
                  <img
                    src={preset.secondary}
                    alt=""
                    className="pointer-events-none absolute right-4 top-4 h-5 w-5 object-contain opacity-80"
                  />
                  <h2 className="pr-6 text-lg font-bold text-brand-brown">{cat.name}</h2>
                  <p className="mt-1 text-xs text-brand-brown-soft">{cat.short_description}</p>

                  {/* Pricing Option Boxes — each styled with a matching minimal or decorative icon */}
                  <div className="mt-4 space-y-2.5">
                    {(selectedStyleCode === 'ALL' || selectedStyleCode === 'MIN') && minimalStyle && (
                      <div className="relative flex items-center justify-between rounded-2xl border border-[#EAD9CE] bg-brand-cream p-3">
                        <div className="flex items-start gap-2.5">
                          <img
                            src={SITE_DECORATIONS.mascots.mascotToast}
                            alt=""
                            className="mt-0.5 h-8 w-8 shrink-0 object-contain"
                          />
                          <div>
                            <p className="text-xs font-bold text-brand-brown">สไตล์ Minimal (มินิมอล)</p>
                            <p className="text-[11px] text-brand-brown-soft">
                              สะอาดตา เน้นข้อความ + ของตกแต่งฟรี 0฿
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="block text-sm font-bold text-brand-brown">
                            {formatTHB(minPrice)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOrderWithStyle(cat.id, minimalStyle.id)}
                            className="mt-1 rounded-xl bg-white px-3 py-1 text-[11px] font-bold text-brand-pink-dark shadow-sm hover:bg-brand-pink-dark hover:text-white"
                          >
                            สั่งแบบ Minimal
                          </button>
                        </div>
                      </div>
                    )}

                    {(selectedStyleCode === 'ALL' || selectedStyleCode === 'DEC') && decorativeStyle && (
                      <div className="relative flex items-center justify-between rounded-2xl border border-brand-pink bg-brand-pink-light/35 p-3">
                        <div className="flex items-start gap-2.5">
                          <img
                            src={SITE_DECORATIONS.sweets.pinkCupcakeStar}
                            alt=""
                            className="mt-0.5 h-8 w-8 shrink-0 object-contain"
                          />
                          <div>
                            <p className="text-xs font-bold text-brand-brown">
                              สไตล์ Decorative (ตกแต่งจัดเต็ม)
                            </p>
                            <p className="text-[11px] text-brand-brown-soft">
                              กรอบลวดลาย สติกเกอร์ + ของตกแต่งฟรี 0฿
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="block text-sm font-bold text-brand-pink-dark">
                            {formatTHB(decPrice)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOrderWithStyle(cat.id, decorativeStyle.id)}
                            className="mt-1 rounded-xl bg-brand-pink-dark px-3 py-1 text-[11px] font-bold text-white shadow-sm hover:opacity-90"
                          >
                            สั่งแบบ Decorative
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#F2E6DF] bg-brand-cream/40 px-5 py-3 text-xs text-emerald-800">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> ของตกแต่งฟรีทุกชิ้น 0 บาท
                  <img src={SITE_DECORATIONS.sweets.miniHeart} alt="" className="h-3.5 w-3.5 object-contain" />
                </span>
                <button
                  type="button"
                  onClick={() => navigate(`/templates?category=${cat.id}`)}
                  className="font-bold text-brand-pink-dark hover:underline"
                >
                  ดูเทมเพลตของป้ายนี้ →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
