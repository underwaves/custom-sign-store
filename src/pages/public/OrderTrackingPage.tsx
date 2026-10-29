import React, { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  PackageSearch,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { OrderRecord, TrackedOrderRecord } from '@/types/database';
import { getOrderStatusMeta, ORDER_STATUS_LIST } from '@/utils/orderStatus';
import { formatTHB } from '@/utils/pricing';
import { SectionHeaderBannerDecor } from '@/components/common/CardFrameDecoration';
import { SITE_DECORATIONS } from '@/data/siteDecorations';
import { toast } from 'sonner';

export const OrderTrackingPage: React.FC = () => {
  const { trackOrderSecure, orders, currentUser } = useStore();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigationState = location.state as { orderNumber?: string; trackingToken?: string } | null;

  const [orderNumberInput, setOrderNumberInput] = useState(
    searchParams.get('order') || navigationState?.orderNumber || ''
  );
  const [tokenInput, setTokenInput] = useState(
    navigationState?.trackingToken || ''
  );
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrderRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const performLookup = async (orderNo: string, token: string) => {
    setSearching(true);
    setErrorMsg(null);
    try {
      const result = await trackOrderSecure(orderNo, token || undefined);
      if (!result) {
        setTrackedOrder(null);
        setErrorMsg(
          'ไม่พบข้อมูลคำสั่งซื้อที่ตรงกับหมายเลขออเดอร์และ Tracking Token (หรือคุณไม่ได้เป็นเจ้าของออเดอร์นี้) กรุณาตรวจสอบความถูกต้องอีกครั้ง'
        );
      } else {
        setTrackedOrder(result);
      }
    } catch (err) {
      setTrackedOrder(null);
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถค้นหาออเดอร์ได้');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const qOrder = searchParams.get('order');
    if (qOrder && currentUser) {
      void performLookup(qOrder, '');
    } else if (!qOrder && navigationState?.orderNumber && navigationState.trackingToken) {
      void performLookup(navigationState.orderNumber, navigationState.trackingToken);
    }
  }, [searchParams, location.key, currentUser?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void performLookup(orderNumberInput, tokenInput);
  };

  const handleFillDemoOrder = (demoOrder: OrderRecord) => {
    setOrderNumberInput(demoOrder.order_number);
    setTokenInput(demoOrder.tracking_access_token);
    void performLookup(demoOrder.order_number, demoOrder.tracking_access_token);
    toast.info(`กรอกข้อมูลออเดอร์ตัวอย่าง ${demoOrder.order_number} แล้ว`);
  };

  const activeStatusMeta = trackedOrder ? getOrderStatusMeta(trackedOrder.status) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      {/* Search Box */}
      <div className="card-pastel relative space-y-6 overflow-hidden p-6 sm:p-8">
        <SectionHeaderBannerDecor
          leftMascot={SITE_DECORATIONS.mascots.bumbleBee}
          rightSweet={SITE_DECORATIONS.cafe.icedBearCup}
          topBow={SITE_DECORATIONS.bows.pinkBow}
        />

        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="badge-pastel bg-brand-pink-light text-brand-pink-dark">
              <PackageSearch className="h-3.5 w-3.5" /> ระบบติดตามออเดอร์ปลอดภัย (PART 14)
              <img src={SITE_DECORATIONS.bows.miniBow} alt="" className="h-4 w-4 object-contain" />
            </span>
            <h1 className="mt-2 text-2xl font-bold text-brand-brown sm:text-3xl">
              ตรวจสอบสถานะการออกแบบป้ายของคุณ
            </h1>
            <p className="mt-1 text-sm text-brand-brown-soft">
              เพื่อความปลอดภัยสูงสุดในการคุ้มครองข้อมูลส่วนบุคคล ระบบกำหนดให้ใช้ <strong>หมายเลขออเดอร์</strong> คู่กับ{' '}
              <strong>Tracking Token แบบสุ่มที่เดายาก</strong> (ไม่ใช้เบอร์โทรศัพท์หรือเลขท้าย 4 ตัว เพื่อป้องกันบุคคลอื่นสุ่มเข้าถึง) หรือ{' '}
              <strong>เข้าสู่ระบบด้วยบัญชีสมาชิกที่เป็นเจ้าของออเดอร์</strong>
            </p>
          </div>
          <div className="relative flex items-center gap-2 rounded-2xl border border-[#EAD9CE] bg-brand-cream p-3.5 pr-12 text-xs">
            <Lock className="h-4 w-4 shrink-0 text-emerald-700" />
            <span>
              {currentUser
                ? `เข้าสู่ระบบในชื่อ ${currentUser.full_name} (ค้นหาออเดอร์ตนเองได้โดยตรง)`
                : 'ป้องกันการสุ่มดูข้อมูลด้วย Token ลับเฉพาะออเดอร์'}
            </span>
            <img
              src={SITE_DECORATIONS.mascots.bumbleBee}
              alt=""
              className="pointer-events-none absolute right-2 top-1.5 h-9 w-9 object-contain"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 grid gap-4 sm:grid-cols-12">
          <div className="sm:col-span-5">
            <label className="mb-1 block text-xs font-bold text-brand-brown">
              หมายเลขออเดอร์ (Order Number) *
            </label>
            <input
              type="text"
              required
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value)}
              placeholder="เช่น CSS-20261027-XXXXX หรือ DEMO-202610-001"
              className="input-pastel text-sm uppercase"
            />
          </div>

          <div className="sm:col-span-5">
            <label className="mb-1 block text-xs font-bold text-brand-brown">
              {currentUser
                ? 'รหัส Tracking Token (ไม่บังคับสำหรับสมาชิกที่ล็อกอิน)'
                : 'รหัส Tracking Token (ได้รับตอนยืนยันออเดอร์) *'}
            </label>
            <input
              type="text"
              required={!currentUser}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder={
                currentUser
                  ? 'เว้นว่างเพื่อดูออเดอร์ของตนเอง หรือระบุ Token'
                  : 'เช่น demo-token-001 หรือ รหัสลับ 32 ตัวอักษร'
              }
              className="input-pastel text-sm"
            />
          </div>

          <div className="flex items-end sm:col-span-2">
            <button
              type="submit"
              disabled={searching}
              className="btn-primary w-full !py-3 text-sm font-bold"
            >
              {searching ? 'กำลังค้นหา...' : 'ค้นหา'}
            </button>
          </div>
        </form>

        {/* Quick Demo Lookup Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 border-t border-[#F2E6DF] pt-4 text-xs">
          <span className="font-semibold text-brand-brown-soft">
            ทดลองค้นหาด้วยออเดอร์ล่าสุด / Demo:
          </span>
          {orders.slice(0, 4).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => handleFillDemoOrder(o)}
              className="rounded-xl border border-[#EAD9CE] bg-brand-cream px-3 py-1 font-medium text-brand-brown hover:border-brand-pink hover:bg-brand-pink-light/40"
            >
              {o.order_number} ({getOrderStatusMeta(o.status).label})
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {errorMsg && (
        <div className="card-pastel relative overflow-hidden border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-800">
          <img
            src={SITE_DECORATIONS.mascots.mascotHeadBerry}
            alt=""
            className="mx-auto mb-2 h-12 w-12 object-contain"
          />
          <p className="font-bold">{errorMsg}</p>
        </div>
      )}

      {/* Tracked Order Result */}
      {trackedOrder && activeStatusMeta && (
        <div className="space-y-6">
          <div className="card-pastel relative space-y-6 overflow-hidden p-6 sm:p-8">
            <img
              src={SITE_DECORATIONS.bows.pinkBow}
              alt=""
              className="pointer-events-none absolute right-5 top-3 h-9 w-9 rotate-6 object-contain opacity-90"
            />
            <img
              src={SITE_DECORATIONS.mascots.bearPudding}
              alt=""
              className="pointer-events-none absolute bottom-4 right-5 hidden h-16 w-16 -rotate-3 object-contain opacity-90 lg:block"
            />

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F2E6DF] pb-5 pr-10">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-brand-brown">
                    ออเดอร์ #{trackedOrder.order_number}
                  </h2>
                  {trackedOrder.is_demo && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                      ข้อมูลตัวอย่าง Demo
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-brand-brown-soft">
                  ลูกค้า: <strong>{trackedOrder.customer_name}</strong> • ช่องทางรับงาน:{' '}
                  <strong>{trackedOrder.delivery_channel}</strong> • สั่งเมื่อ:{' '}
                  {new Date(trackedOrder.created_at).toLocaleString('th-TH')}
                </p>
              </div>

              <div className="text-right">
                <span className="block text-xs text-brand-brown-soft">สถานะปัจจุบัน</span>
                <span
                  className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold ${activeStatusMeta.badgeClass}`}
                >
                  <Sparkles className="h-4 w-4" />
                  {activeStatusMeta.label}
                </span>
                <p className="mt-1 text-xs text-brand-brown-soft">{activeStatusMeta.description}</p>
              </div>
            </div>

            {/* 9-Step Visual Status Pipeline (excluding Cancelled) */}
            {trackedOrder.status !== 'cancelled' && (
              <div>
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase text-brand-brown">
                  <img src={SITE_DECORATIONS.mascots.bumbleBee} alt="" className="h-4 w-4 object-contain" />
                  ความคืบหน้าของงานออกแบบ (10 สถานะมาตรฐาน):
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
                  {ORDER_STATUS_LIST.filter((s) => s.value !== 'cancelled').map((st) => {
                    const isCurrent = st.value === trackedOrder.status;
                    const isPassed = st.stepOrder < activeStatusMeta.stepOrder;
                    return (
                      <div
                        key={st.value}
                        className={`rounded-2xl border p-2.5 text-center text-[11px] font-semibold transition ${
                          isCurrent
                            ? 'border-brand-pink-dark bg-brand-pink-dark text-white shadow-sm'
                            : isPassed
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                            : 'border-transparent bg-brand-cream text-brand-brown-soft'
                        }`}
                      >
                        <div className="mx-auto mb-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[10px] font-bold text-brand-brown">
                          {isPassed ? '✓' : st.stepOrder}
                        </div>
                        <span className="line-clamp-2">{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status History Timeline */}
            <div>
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-brand-brown">
                <Clock className="h-4 w-4 text-brand-pink-dark" /> ประวัติการอัปเดตสถานะ
              </h3>
              <div className="space-y-2.5">
                {trackedOrder.history.map((h) => {
                  const meta = getOrderStatusMeta(h.status);
                  return (
                    <div
                      key={h.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-brand-cream px-4 py-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span className={`rounded-full px-2.5 py-0.5 font-bold ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                        <span className="font-medium text-brand-brown">{h.note}</span>
                      </div>
                      <span className="text-brand-brown-soft">
                        โดย {h.changed_by_name} • {new Date(h.created_at).toLocaleString('th-TH')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items & Masked Sensitive Data */}
            <div className="space-y-3 border-t border-[#F2E6DF] pt-5">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-brand-brown">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                รายการป้ายในออเดอร์ (ข้อมูลที่ระบุว่าเป็นข้อมูลอ่อนไหวถูกซ่อน)
              </h3>

              {trackedOrder.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="relative space-y-2 overflow-hidden rounded-2xl border border-[#EAD9CE] bg-white p-4 text-xs"
                >
                  <img
                    src={SITE_DECORATIONS.sweets.roundPeachCake}
                    alt=""
                    className="pointer-events-none absolute right-3 top-3 h-10 w-10 object-contain opacity-90"
                  />
                  <div className="flex justify-between pr-12 text-sm font-bold text-brand-brown">
                    <span>
                      #{idx + 1} {item.snapshot_sign_type_name} ({item.snapshot_style_name}) — เทมเพลต{' '}
                      {item.snapshot_template_code}
                    </span>
                    <span className="text-brand-pink-dark">{formatTHB(item.item_total_price)}</span>
                  </div>
                  <p className="text-brand-brown-soft">
                    ราคาฐาน ณ วันสั่งซื้อ: {formatTHB(item.snapshot_base_price)} + สไตล์{' '}
                    {formatTHB(item.snapshot_style_price)} + ของตกแต่งฟรี{' '}
                    <strong className="text-emerald-700">0 บาท</strong>
                  </p>
                  {item.decorations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.decorations.map((d, dIdx) => (
                        <span
                          key={dIdx}
                          className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900"
                        >
                          🎀 {d.snapshot_decoration_name} (ฟรี 0฿)
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="grid gap-1.5 pt-1 sm:grid-cols-2">
                    {item.fields.map((f, fIdx) => (
                      <div key={fIdx} className="rounded-xl bg-brand-cream px-3 py-1.5">
                        <span className="text-brand-brown-soft">{f.snapshot_field_label}: </span>
                        <strong className="text-brand-brown">{f.field_value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 border-t border-[#EAD9CE] pt-4 text-xs">
              <div className="flex justify-between">
                <span className="text-brand-brown-soft">รวมราคาป้าย:</span>
                <span className="font-semibold text-brand-brown">{formatTHB(trackedOrder.subtotal_amount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>ของตกแต่งพาสเทลทุกชิ้น:</span>
                <span className="font-bold">ฟรี 0 บาท</span>
              </div>
              {trackedOrder.service_fee > 0 && (
                <div className="flex justify-between text-brand-brown">
                  <span className="text-brand-brown-soft">ค่าบริการเพิ่มเติม:</span>
                  <span className="font-semibold">+{formatTHB(trackedOrder.service_fee)}</span>
                </div>
              )}
              {trackedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>ส่วนลดโปรโมชั่น ({trackedOrder.promotion_code}):</span>
                  <span className="font-bold">-{formatTHB(trackedOrder.discount_amount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-[#EAD9CE] pt-2 text-base font-bold">
                <span className="text-brand-brown">ยอดรวมสุทธิของออเดอร์นี้:</span>
                <span className="text-xl text-brand-pink-dark">
                  {formatTHB(trackedOrder.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
