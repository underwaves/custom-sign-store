import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  FileText,
  Send,
  Sparkles,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { SITE_DECORATIONS } from '@/data/siteDecorations';
import { SectionHeaderBannerDecor } from '@/components/common/CardFrameDecoration';
import { toast } from 'sonner';

// ============================================================================
// 15. ContactPage
// ============================================================================
export const ContactPage: React.FC = () => {
  const { siteSettings } = useStore();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('ส่งข้อความสอบถามเรียบร้อยแล้ว แอดมินจะติดต่อกลับโดยเร็วที่สุดค่ะ');
    setName('');
    setContact('');
    setMessage('');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <div className="card-pastel relative overflow-hidden p-6 sm:p-8">
        <SectionHeaderBannerDecor
          leftMascot={SITE_DECORATIONS.mascots.bearPudding}
          rightSweet={SITE_DECORATIONS.cafe.icedBearCup}
          topBow={SITE_DECORATIONS.bows.pinkBow}
        />
        <span className="badge-pastel bg-brand-pink-light text-brand-pink-dark">
          <MessageCircle className="h-3.5 w-3.5" /> ช่องทางติดต่อร้านค้า (Contact Us)
        </span>
        <h1 className="mt-2 text-2xl font-bold text-brand-brown sm:text-3xl">
          ติดต่อ {siteSettings.branding.shop_name}
        </h1>
        <p className="mt-1 text-sm text-brand-brown-soft">
          คุณสามารถกดสั่งทำป้ายได้ด้วยตนเองตลอด 24 ชม. ผ่านระบบ Order Wizard หรือติดต่อสอบถามเพิ่มเติมตามช่องทางด้านล่าง
        </p>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl bg-brand-cream p-5 space-y-3 text-sm border border-[#EAD9CE]">
              <p>
                <strong>LINE Official Account:</strong> {siteSettings.contact_footer.line_id}
              </p>
              <p>
                <strong>Instagram:</strong> {siteSettings.contact_footer.instagram}
              </p>
              <p>
                <strong>Facebook Page:</strong> {siteSettings.contact_footer.facebook}
              </p>
              <p>
                <strong>อีเมล:</strong> {siteSettings.contact_footer.email}
              </p>
              <p>
                <strong>เบอร์โทรศัพท์:</strong> {siteSettings.contact_footer.phone}
              </p>
              <p>
                <strong>เวลาทำการ:</strong> {siteSettings.contact_footer.working_hours}
              </p>
            </div>

            <div className="rounded-2xl border border-brand-pink bg-brand-pink-light/35 p-4 text-xs text-brand-brown">
              <div>
                💡 <strong>ไม่ต้องรอแอดมินตอบแชตก็สั่งป้ายได้!</strong> คลิกที่ปุ่ม{' '}
                <Link to="/order-wizard" className="font-bold text-brand-pink-dark underline">
                  เริ่มสั่งทำป้ายออนไลน์
                </Link>{' '}
                เพื่อเลือกประเภทป้าย สไตล์ เทมเพลต และของตกแต่งฟรีได้เลยค่ะ
              </div>
            </div>
          </div>

          <form onSubmit={handleSendInquiry} className="relative space-y-4">
            <div className="flex items-center gap-2">
              <img
                src={SITE_DECORATIONS.mascots.honeyBearBottle}
                alt=""
                aria-hidden="true"
                className="h-7 w-7 object-contain"
              />
              <h2 className="text-lg font-bold text-brand-brown">ฝากข้อความติดต่อร้าน</h2>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-brand-brown">ชื่อของคุณ *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ระบุชื่อของคุณ"
                className="input-pastel text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-brand-brown">
                เบอร์โทร หรือ LINE ID สำหรับติดต่อกลับ *
              </label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="เช่น LINE: @yourid หรือ 08x-xxx-xxxx"
                className="input-pastel text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-brand-brown">
                ข้อความที่ต้องการสอบถาม *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="พิมพ์รายละเอียดที่ต้องการสอบถาม..."
                className="input-pastel text-sm"
              />
            </div>
            <button type="submit" className="btn-primary w-full text-sm font-bold">
              <Send className="h-4 w-4" /> ส่งข้อความถึงร้านค้า
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 16. FaqPage
// ============================================================================
export const FaqPage: React.FC = () => {
  const { siteSettings } = useStore();
  const faqAccents = [
    SITE_DECORATIONS.mascots.bumbleBee,
    SITE_DECORATIONS.sweets.pinkCupcakeStar,
    SITE_DECORATIONS.cafe.icedBearCup,
    SITE_DECORATIONS.mascots.rabbitCute,
    SITE_DECORATIONS.sweets.custardPuddingSpoon,
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div className="card-pastel relative overflow-hidden p-6 sm:p-8">
        <SectionHeaderBannerDecor
          leftMascot={SITE_DECORATIONS.mascots.bumbleBee}
          rightSweet={SITE_DECORATIONS.sweets.pinkCupcakeStar}
          topBow={SITE_DECORATIONS.bows.pinkBow}
        />
        <span className="badge-pastel bg-brand-pink-light text-brand-pink-dark">
          <HelpCircle className="h-3.5 w-3.5" /> คำถามที่พบบ่อย (FAQ)
        </span>
        <h1 className="mt-2 text-2xl font-bold text-brand-brown sm:text-3xl">
          ข้อสงสัยเกี่ยวกับการสั่งทำป้ายออนไลน์
        </h1>
        <p className="mt-1 text-sm text-brand-brown-soft">
          รวมคำตอบสำหรับขั้นตอนการสั่งทำป้าย การเลือกสไตล์ ของตกแต่งฟรี และการติดตามสถานะออเดอร์
        </p>

        <div className="mt-6 space-y-4">
          {siteSettings.faq_list.map((item, idx) => (
            <div key={idx} className="relative overflow-hidden rounded-2xl border border-[#EAD9CE] bg-brand-cream p-5">
              <img
                src={faqAccents[idx % faqAccents.length]}
                alt=""
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-1 -right-1 h-12 w-12 object-contain opacity-85 drop-shadow-sm"
              />
              <h2 className="text-base font-bold text-brand-brown pr-10">
                {idx + 1}. {item.question}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-brown-soft pr-10">{item.answer}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-8 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl bg-brand-pink-light/40 p-5">
          <img
            src={SITE_DECORATIONS.mascots.bearPudding}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none h-12 w-12 object-contain drop-shadow-sm"
          />
          <div className="flex-1">
            <p className="font-bold text-brand-brown">พร้อมเริ่มออกแบบป้ายของคุณแล้วหรือยังคะ?</p>
            <p className="text-xs text-brand-brown-soft">
              เลือกเทมเพลตและของตกแต่งฟรี 0 บาทได้ด้วยตัวเองทันที
            </p>
          </div>
          <Link to="/order-wizard" className="btn-primary text-sm">
            <Sparkles className="h-4 w-4" /> เริ่มสั่งทำป้าย
          </Link>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 17. PrivacyPolicyPage
// ============================================================================
export const PrivacyPolicyPage: React.FC = () => {
  const { siteSettings } = useStore();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="card-pastel p-6 sm:p-8 space-y-5">
        <span className="badge-pastel bg-emerald-100 text-emerald-800">
          <ShieldCheck className="h-3.5 w-3.5" /> นโยบายความเป็นส่วนตัว (Privacy Policy)
        </span>
        <h1 className="text-2xl font-bold text-brand-brown">
          นโยบายการคุ้มครองข้อมูลส่วนบุคคล — {siteSettings.branding.shop_name}
        </h1>
        <div className="space-y-4 text-sm leading-relaxed text-brand-brown-soft">
          <p>
            1. <strong>การเก็บรวบรวมข้อมูลเพื่อผลิตงานป้าย:</strong> ข้อมูลที่ลูกค้ากรอกในระบบ Order Wizard
            เช่น ชื่อร้าน เลขบัญชีธนาคาร ชื่อบัญชี เบอร์โทรศัพท์ และรูปภาพอ้างอิง จะถูกจัดเก็บภายใต้การควบคุมสิทธิ์
            Row Level Security (RLS) เพื่อใช้สำหรับจัดทำป้ายตามคำสั่งซื้อของลูกค้าเท่านั้น
          </p>
          <p>
            2. <strong>การไม่เปิดเผยข้อมูลส่วนตัวสู่สาธารณะ:</strong> ทางร้านมีนโยบายอย่างเคร่งครัดที่จะไม่นำข้อมูลส่วนตัวของลูกค้า
            (โดยเฉพาะเลขบัญชีธนาคาร ชื่อบัญชี และไฟล์อ้างอิงใน Bucket <code>customer-references</code>)
            ไปแสดงในหน้าเว็บไซต์สาธารณะโดยอัตโนมัติ
          </p>
          <p>
            3. <strong>การตรวจสอบสถานะคำสั่งซื้ออย่างปลอดภัย:</strong> ระบบติดตามออเดอร์สำหรับผู้สั่งซื้อทั่วไป
            (Guest) กำหนดให้ต้องยืนยันทั้งหมายเลขออเดอร์และข้อมูลติดต่อ พร้อมทำการพรางตัวเลขสำคัญบางส่วนเสมอ
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 18. TermsOfServicePage
// ============================================================================
export const TermsOfServicePage: React.FC = () => {
  const { siteSettings } = useStore();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="card-pastel p-6 sm:p-8 space-y-5">
        <span className="badge-pastel bg-brand-pink-light text-brand-pink-dark">
          <FileText className="h-3.5 w-3.5" /> ข้อกำหนดและเงื่อนไขการใช้บริการ (Terms of Service)
        </span>
        <h1 className="text-2xl font-bold text-brand-brown">
          ข้อกำหนดการสั่งทำป้ายออนไลน์ — {siteSettings.branding.shop_name}
        </h1>
        <div className="space-y-4 text-sm leading-relaxed text-brand-brown-soft">
          <p>
            1. <strong>การเลือกรูปแบบป้ายและเทมเพลต:</strong> เว็บไซต์ให้บริการสั่งทำป้ายสำเร็จรูปโดยลูกค้าเลือกประเภทป้าย
            สไตล์ (Minimal หรือ Decorative) เทมเพลตต้นแบบ และของตกแต่งฟรี พร้อมกรอกข้อความเพื่อให้ทางร้านนำไปจัดวางและผลิตไฟล์งานจริง
          </p>
          <p>
            2. <strong>การคำนวณราคาและการรับประกันราคาเดิม:</strong> ราคาต่อป้ายคำนวณจากราคาฐานของประเภทป้ายบวกราคาเพิ่มของสไตล์
            ส่วนของตกแต่งทุกชิ้นมีราคา 0 บาท (ฟรี) เมื่อลูกค้ายืนยันคำสั่งซื้อแล้ว ระบบจะบันทึก Snapshot ราคาไว้ในออเดอร์นั้นทันที
            แม้ในอนาคตร้านค้าจะปรับราคาสินค้าในระบบหลังบ้าน ก็จะไม่ส่งผลกระทบต่อยอดเงินในออเดอร์ที่สั่งไว้แล้ว
          </p>
          <p>
            3. <strong>การตรวจสอบความถูกต้องของข้อความ:</strong> กรุณาตรวจสอบตัวสะกดและตัวเลขสำคัญ (เช่น เลขบัญชีธนาคาร
            และเบอร์โทรศัพท์) ในขั้นตอนที่ 6 และ 7 ก่อนกดยืนยันคำสั่งซื้อทุกครั้ง
          </p>
        </div>
      </div>
    </div>
  );
};
