import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Copy, PackageSearch, Sparkles, ShieldCheck } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useOrderWizard } from '@/context/OrderWizardContext';
import { formatTHB } from '@/utils/pricing';
import { getOrderStatusMeta } from '@/utils/orderStatus';
import { toast } from 'sonner';
import { SITE_DECORATIONS } from '@/data/siteDecorations';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { orders } = useStore();
  const { lastConfirmedOrder } = useOrderWizard();

  const order =
    (lastConfirmedOrder && lastConfirmedOrder.order_number === orderNumber
      ? lastConfirmedOrder
      : null) ?? orders.find((o) => o.order_number === orderNumber) ?? lastConfirmedOrder;

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="card-pastel relative space-y-4 overflow-hidden p-10">
          <img
            src={SITE_DECORATIONS.mascots.bearPudding}
            alt=""
            className="mx-auto h-20 w-20 object-contain"
          />
          <h1 className="text-2xl font-bold text-brand-brown">บันทึกคำสั่งซื้อเรียบร้อยแล้ว</h1>
          <p className="text-sm text-brand-brown-soft">
            คุณสามารถตรวจสอบสถานะคำสั่งซื้อได้ที่หน้าติดตามออเดอร์
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/track-order" className="btn-primary">
              ไปหน้าติดตามออเดอร์
            </Link>
            <Link to="/" className="btn-secondary">
              กลับหน้าแรก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusMeta = getOrderStatusMeta(order.status);

  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(`คัดลอก${label}เรียบร้อยแล้ว`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="card-pastel relative overflow-hidden p-6 sm:p-10">
        {/* Celebration corner pins & mascots */}
        <img
          src={SITE_DECORATIONS.bows.pinkBow}
          alt=""
          className="pointer-events-none absolute right-6 top-3 h-11 w-11 rotate-6 object-contain drop-shadow-xs"
        />
        <img
          src={SITE_DECORATIONS.sparkles.starBurst}
          alt=""
          className="pointer-events-none absolute left-5 top-4 h-8 w-8 object-contain opacity-85"
        />

        <div className="relative space-y-3 border-b border-[#F2E6DF] pb-6 text-center">
          <div className="flex items-center justify-center gap-4">
            <img
              src={SITE_DECORATIONS.mascots.rabbitCute}
              alt=""
              className="h-14 w-14 -rotate-6 object-contain drop-shadow-sm"
            />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-xs">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <img
              src={SITE_DECORATIONS.mascots.bearPudding}
              alt=""
              className="h-14 w-14 rotate-6 object-contain drop-shadow-sm"
            />
          </div>
          <span className="badge-pastel bg-emerald-100 text-emerald-800">
            บันทึกคำสั่งซื้อสำเร็จ (Order Confirmed)
            <img src={SITE_DECORATIONS.sweets.miniHeart} alt="" className="h-3.5 w-3.5 object-contain" />
          </span>
          <h1 className="text-2xl font-bold text-brand-brown sm:text-3xl">
            ขอบคุณที่สั่งทำป้ายกับเรานะคะ!
          </h1>
          <p className="mx-auto max-w-xl text-sm text-brand-brown-soft">
            ระบบได้บันทึกออเดอร์ รายการป้าย ฟิลด์ข้อความ ของตกแต่งฟรี และล็อก Snapshot ราคา ณ เวลาสั่งซื้อลงฐานข้อมูลเรียบร้อยแล้ว
          </p>
        </div>

        {/* Order Number & Verification Credentials Box */}
        <div className="relative my-6 grid gap-4 overflow-hidden rounded-3xl border-2 border-brand-pink bg-brand-pink-light/35 p-5 sm:grid-cols-2">
          <img
            src={SITE_DECORATIONS.mascots.bumbleBee}
            alt=""
            className="pointer-events-none absolute bottom-2 right-3 hidden h-12 w-12 object-contain opacity-90 sm:block"
          />
          <div>
            <span className="text-xs text-brand-brown-soft">หมายเลขออเดอร์ของคุณ (Order Number):</span>
            <div className="mt-1 flex items-center gap-2">
              <strong className="text-xl font-bold text-brand-brown">{order.order_number}</strong>
              <button
                type="button"
                onClick={() => copyToClipboard(order.order_number, 'หมายเลขออเดอร์')}
                className="rounded-xl bg-white p-1.5 text-xs text-brand-brown shadow-sm hover:bg-brand-cream"
                title="คัดลอกหมายเลขออเดอร์"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-brand-brown-soft">
              บันทึกคำสั่งซื้อสำหรับคุณ {order.customer_name} • ส่งงานผ่าน {order.delivery_channel}
            </p>
          </div>

          <div className="flex flex-col justify-between sm:items-end sm:pr-12">
            <div>
              <span className="block text-xs text-brand-brown-soft sm:text-right">สถานะเริ่มต้น:</span>
              <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${statusMeta.badgeClass}`}>
                {statusMeta.label}
              </span>
            </div>
            <div className="mt-3">
              <span className="block text-xs font-semibold text-brand-brown sm:text-right">
                รหัส Tracking Token (สำหรับลูกค้าทั่วไป):
              </span>
              <div className="mt-1 flex items-center gap-1.5 sm:justify-end">
                <code className="rounded-xl bg-white px-2.5 py-1 font-mono text-xs font-bold text-brand-pink-dark shadow-xs">
                  {order.tracking_access_token}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(order.tracking_access_token, 'Tracking Token')}
                  className="rounded-xl bg-white p-1 text-xs text-brand-brown shadow-xs hover:bg-brand-cream"
                  title="คัดลอก Tracking Token"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1 text-[11px] text-brand-brown-soft sm:text-right">
                ใช้สำหรับติดตามสถานะงานอย่างปลอดภัยแทนเลขโทรศัพท์
              </p>
            </div>
          </div>
        </div>

        {/* Snapshot Items Breakdown */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-brand-brown">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            รายละเอียดป้ายและ Snapshot ราคาที่บันทึกไว้ ({order.items.length} รายการ)
          </h2>

          {order.items.map((item, idx) => (
            <div
              key={item.id}
              className="relative space-y-2 overflow-hidden rounded-2xl border border-[#EAD9CE] bg-brand-cream p-4 text-xs"
            >
              <img
                src={
                  idx % 2 === 0
                    ? SITE_DECORATIONS.sweets.cherryCustardPudding
                    : SITE_DECORATIONS.sweets.pinkRollCake
                }
                alt=""
                className="pointer-events-none absolute right-3 top-3 h-10 w-10 object-contain opacity-90"
              />
              <div className="flex flex-wrap justify-between gap-2 pr-12 text-sm font-bold text-brand-brown">
                <span>
                  #{idx + 1} {item.snapshot_sign_type_name} — {item.snapshot_style_name}
                </span>
                <span className="text-brand-pink-dark">{formatTHB(item.item_total_price)}</span>
              </div>
              <p className="text-brand-brown-soft">
                เทมเพลต: <strong>{item.snapshot_template_code}</strong> ({item.snapshot_template_name}) •
                ราคาฐาน {formatTHB(item.snapshot_base_price)} + สไตล์{' '}
                {formatTHB(item.snapshot_style_price)} + ของตกแต่งฟรี{' '}
                <strong className="text-emerald-700">0 บาท</strong>
              </p>

              {item.decorations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
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

              <div className="grid gap-1.5 pt-2 sm:grid-cols-2">
                {item.fields.map((f, fIdx) => (
                  <div key={fIdx} className="rounded-xl border border-[#EFE2D9] bg-white px-3 py-1.5">
                    <span className="text-brand-brown-soft">{f.snapshot_field_label}: </span>
                    <strong className="text-brand-brown">{f.field_value || '-'}</strong>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="relative mt-6 space-y-2 overflow-hidden rounded-2xl border border-[#EAD9CE] bg-white p-5 text-sm">
          <img
            src={SITE_DECORATIONS.badges.stampSquare}
            alt=""
            className="pointer-events-none absolute bottom-3 right-3 h-7 w-7 object-contain opacity-80"
          />
          <div className="flex justify-between text-xs">
            <span className="text-brand-brown-soft">ผู้สั่งซื้อ:</span>
            <span className="font-semibold">
              {order.customer_name} ({order.customer_contact}) • รับงานทาง {order.delivery_channel}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-brand-brown-soft">รวมราคาป้าย:</span>
            <span>{formatTHB(order.subtotal_amount)}</span>
          </div>
          <div className="flex justify-between text-xs text-emerald-700">
            <span>ของตกแต่งพาสเทลทุกชิ้น:</span>
            <span className="font-bold">ฟรี 0 บาท</span>
          </div>
          {order.service_fee > 0 && (
            <div className="flex justify-between text-xs text-brand-brown">
              <span className="text-brand-brown-soft">ค่าบริการเพิ่มเติม:</span>
              <span>+{formatTHB(order.service_fee)}</span>
            </div>
          )}
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-xs text-emerald-700">
              <span>ส่วนลดโปรโมชั่น ({order.promotion_code}):</span>
              <span>-{formatTHB(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-[#EAD9CE] pt-2.5 pr-8 text-lg font-bold">
            <span>ยอดสุทธิที่บันทึกไว้:</span>
            <span className="text-brand-pink-dark">{formatTHB(order.total_amount)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/track-order"
            state={{ orderNumber: order.order_number, trackingToken: order.tracking_access_token }}
            className="btn-primary"
          >
            <PackageSearch className="h-4 w-4" /> ติดตามสถานะออเดอร์นี้
          </Link>
          <Link to="/order-wizard" className="btn-secondary">
            <Sparkles className="h-4 w-4" /> สั่งทำป้ายออเดอร์ใหม่
          </Link>
          <Link to="/" className="btn-secondary">
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    </div>
  );
};
