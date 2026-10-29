import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, PlusCircle, Trash2, Sparkles, ArrowRight, Gift } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useOrderWizard } from '@/context/OrderWizardContext';
import { calculateOrderPricing, formatTHB } from '@/utils/pricing';
import { SectionHeaderBannerDecor } from '@/components/common/CardFrameDecoration';
import { SITE_DECORATIONS, CATEGORY_DECOR_PRESETS } from '@/data/siteDecorations';

export const OrderSummaryPage: React.FC = () => {
  const { signCategories, signStyles, signTemplates, decorations, promotions, siteSettings } =
    useStore();
  const {
    wizard,
    setStep,
    setActiveItemIndex,
    addAnotherSignItem,
    removeSignItem,
    setPromotionCode,
  } = useOrderWizard();
  const navigate = useNavigate();

  const pricing = calculateOrderPricing({
    draftItems: wizard.items,
    categories: signCategories,
    styles: signStyles,
    templates: signTemplates,
    promotions,
    promotionCode: wizard.promotion_code,
    serviceFee: siteSettings.contact_footer.service_fee ?? 0,
  });

  const handleProceedToCheckout = () => {
    setStep(6);
    navigate('/order-wizard');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="card-pastel relative flex flex-col justify-between gap-4 overflow-hidden p-6 sm:flex-row sm:items-center sm:p-8">
        <SectionHeaderBannerDecor
          leftMascot={SITE_DECORATIONS.mascots.bearPudding}
          rightSweet={SITE_DECORATIONS.sweets.pinkSyrupPancakes}
          topBow={SITE_DECORATIONS.bows.pinkBow}
        />

        <div className="relative z-10">
          <span className="badge-pastel bg-brand-pink-light text-brand-pink-dark">
            <ShoppingBag className="h-3.5 w-3.5" /> สรุปรายการสั่งทำป้าย (Order Summary)
            <img src={SITE_DECORATIONS.bows.miniBow} alt="" className="h-4 w-4 object-contain" />
          </span>
          <h1 className="mt-2 text-2xl font-bold text-brand-brown sm:text-3xl">
            ตรวจสอบรายการป้ายในออเดอร์ของคุณ ({wizard.items.length} รายการ)
          </h1>
          <p className="text-sm text-brand-brown-soft">
            สามารถเพิ่มป้ายหลายประเภทในออเดอร์เดียวกัน หรือแก้ไขรายละเอียดแต่ละป้ายก่อนยืนยันคำสั่งซื้อ
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            addAnotherSignItem();
            navigate('/order-wizard');
          }}
          className="btn-secondary relative z-10 text-xs font-bold"
        >
          <PlusCircle className="h-4 w-4 text-brand-pink-dark" />
          <span>+ เพิ่มป้ายรายการใหม่</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {wizard.items.map((item, idx) => {
            const cat = signCategories.find((c) => c.id === item.sign_category_id);
            const style = signStyles.find((s) => s.id === item.style_id);
            const tpl = signTemplates.find((t) => t.id === item.template_id);
            const bd = pricing.items[idx];
            const preset = CATEGORY_DECOR_PRESETS[idx % CATEGORY_DECOR_PRESETS.length];

            return (
              <div key={item.draft_id} className="card-pastel relative space-y-4 overflow-hidden p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F2E6DF] pb-4">
                  <div className="flex items-center gap-3">
                    {tpl ? (
                      <img
                        src={tpl.preview_image_url}
                        alt={tpl.name}
                        className="h-16 w-14 rounded-xl border border-[#EAD9CE] object-cover"
                      />
                    ) : (
                      <img
                        src={preset.primary}
                        alt=""
                        className="animate-float-slow h-12 w-12 object-contain"
                      />
                    )}
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-pink-light px-2.5 py-0.5 text-[11px] font-bold text-brand-pink-dark">
                        <img src={preset.pin} alt="" className="animate-wiggle-cute h-3.5 w-3.5 object-contain" />
                        ป้ายใบที่ #{idx + 1}
                      </span>
                      <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-brand-brown">
                        <span>{cat?.name ?? 'ยังไม่ได้เลือกประเภทป้าย'}</span>
                        <img src={preset.primary} alt="" className="animate-float-slow h-6 w-6 object-contain" />
                      </h2>
                      <p className="text-xs text-brand-brown-soft">
                        สไตล์: {style?.name ?? 'ยังไม่เลือก'} • เทมเพลต:{' '}
                        {tpl ? `${tpl.code} (${tpl.name})` : 'ยังไม่เลือก'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveItemIndex(idx);
                        setStep(cat ? 5 : 1);
                        navigate('/order-wizard');
                      }}
                      className="btn-secondary !px-3.5 !py-2 text-xs"
                    >
                      แก้ไขรายละเอียด
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSignItem(idx)}
                      className="rounded-2xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
                      title="ลบรายการ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 text-xs sm:grid-cols-2">
                  <div className="relative overflow-hidden rounded-2xl bg-brand-cream p-3.5 pr-10">
                    <img
                      src={SITE_DECORATIONS.mascots.honeyBearBottle}
                      alt=""
                      className="pointer-events-none absolute right-2 top-2 h-8 w-8 object-contain opacity-85"
                    />
                    <p className="mb-1 font-bold text-brand-brown">ข้อความที่กรอก:</p>
                    {Object.keys(item.field_values).length === 0 ? (
                      <p className="text-brand-brown-soft">ยังไม่ได้กรอกข้อความ</p>
                    ) : (
                      Object.entries(item.field_values).map(([k, v]) => (
                        <p key={k} className="truncate text-brand-brown">
                          • <strong>{k}:</strong> {v || '-'}
                        </p>
                      ))
                    )}
                  </div>

                  <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 pr-10">
                    <img
                      src={SITE_DECORATIONS.mascots.rabbitCute}
                      alt=""
                      className="pointer-events-none absolute right-2 top-2 h-9 w-9 object-contain opacity-90"
                    />
                    <p className="mb-1 flex items-center gap-1 font-bold text-emerald-900">
                      <Gift className="h-3.5 w-3.5" /> ของตกแต่งฟรี ({item.decoration_ids.length} ชิ้น):
                    </p>
                    {item.decoration_ids.length === 0 ? (
                      <p className="text-emerald-800">ไม่ได้เลือกของตกแต่งเพิ่ม (0 บาท)</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {item.decoration_ids.map((id) => {
                          const d = decorations.find((x) => x.id === id);
                          return d ? (
                            <span
                              key={id}
                              className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-emerald-900"
                            >
                              {d.name} (FREE)
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#F2E6DF] pt-3 text-xs">
                  <span className="text-brand-brown-soft">
                    ราคาฐาน {formatTHB(bd.base_price)} + สไตล์ {formatTHB(bd.style_price)} + ของตกแต่ง{' '}
                    <strong className="text-emerald-700">0 บาท</strong> × {bd.quantity}
                  </span>
                  <span className="text-base font-bold text-brand-pink-dark">
                    {formatTHB(bd.line_total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-4">
          <div className="card-pastel relative space-y-4 overflow-hidden p-6">
            <img
              src={SITE_DECORATIONS.sweets.custardPuddingSpoon}
              alt=""
              className="pointer-events-none absolute right-4 top-3 h-12 w-12 object-contain opacity-95"
            />
            <h3 className="flex items-center gap-2 pr-12 text-lg font-bold text-brand-brown">
              <img src={SITE_DECORATIONS.bows.pinkBow} alt="" className="h-5 w-5 object-contain" />
              ยอดรวมคำสั่งซื้อ
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-xs">
                <span className="text-brand-brown-soft">ยอดรวมค่าป้าย ({wizard.items.length} ใบ)</span>
                <span className="font-semibold">{formatTHB(pricing.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700">
                <span>ของตกแต่งพาสเทลทุกชิ้น</span>
                <span className="font-bold">ฟรี 0 บาท</span>
              </div>
              {pricing.service_fee > 0 && (
                <div className="flex justify-between text-xs text-brand-brown">
                  <span className="text-brand-brown-soft">ค่าบริการเพิ่มเติม</span>
                  <span className="font-semibold">+{formatTHB(pricing.service_fee)}</span>
                </div>
              )}
              {pricing.discount_amount > 0 && (
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>ส่วนลด ({pricing.applied_promotion?.code})</span>
                  <span>-{formatTHB(pricing.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#EAD9CE] pt-3 text-lg font-bold">
                <span>ยอดสุทธิ</span>
                <span className="text-brand-pink-dark">{formatTHB(pricing.grand_total)}</span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-brand-brown">โค้ดส่วนลด</label>
              <input
                type="text"
                value={wizard.promotion_code}
                onChange={(e) => setPromotionCode(e.target.value)}
                placeholder="เช่น PASTEL10"
                className="input-pastel !py-2 text-xs uppercase"
              />
            </div>

            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="btn-primary w-full !py-3.5 text-sm font-bold"
            >
              <Sparkles className="h-4 w-4" />
              <span>ไปหน้าตรวจสอบและยืนยันออเดอร์</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <Link to="/categories" className="btn-secondary w-full text-xs">
              เลือกดูประเภทป้ายเพิ่มเติม
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
