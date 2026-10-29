import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Eye,
  Gift,
  Trash2,
  PlusCircle,
  AlertCircle,
  ShieldAlert,
  Upload,
  Search,
  Tag,
  Lock,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useOrderWizard } from '@/context/OrderWizardContext';
import { calculateOrderPricing, formatTHB } from '@/utils/pricing';
import { uploadFileToBucket } from '@/lib/supabase';
import { ImageLightboxModal } from '@/components/common/ImageLightboxModal';
import { SignTemplate } from '@/types/database';
import { toast } from 'sonner';
import {
  SITE_DECORATIONS,
  CATEGORY_DECOR_PRESETS,
  TEMPLATE_CARD_ACCENTS,
} from '@/data/siteDecorations';

const WIZARD_STEPS = [
  { step: 1, title: 'เลือกประเภทป้าย', icon: SITE_DECORATIONS.mascots.toastEggSmile },
  { step: 2, title: 'เลือกสไตล์', icon: SITE_DECORATIONS.sweets.pinkCupcakeStar },
  { step: 3, title: 'เลือกเทมเพลต', icon: SITE_DECORATIONS.sweets.cherryCreamTart },
  { step: 4, title: 'ของตกแต่งฟรี (0฿)', icon: SITE_DECORATIONS.mascots.rabbitCute },
  { step: 5, title: 'กรอกรายละเอียด', icon: SITE_DECORATIONS.mascots.honeyBearBottle },
  { step: 6, title: 'ตรวจสอบราคา', icon: SITE_DECORATIONS.sweets.custardPuddingSpoon },
  { step: 7, title: 'ติดต่อ & ยืนยัน', icon: SITE_DECORATIONS.mascots.bumbleBee },
] as const;

export const CustomOrderWizardPage: React.FC = () => {
  const {
    categoryGroups,
    signCategories,
    signStyles,
    signTemplates,
    decorationColors,
    decorationCategories,
    decorations,
    productFields,
    promotions,
    siteSettings,
    submitOrder,
  } = useStore();

  const {
    wizard,
    activeItem,
    setStep,
    setActiveItemIndex,
    selectSignCategory,
    selectStyle,
    selectTemplate,
    toggleDecorationSelection,
    clearDecorationsForActiveItem,
    setFieldValue,
    setFieldFile,
    setItemQuantity,
    setItemNote,
    addAnotherSignItem,
    removeSignItem,
    setPromotionCode,
    setCustomerInfo,
    resetWizard,
    setLastConfirmedOrder,
  } = useOrderWizard();

  const navigate = useNavigate();

  // Local UI state for filters inside steps
  const [step1Group, setStep1Group] = useState<string>('ALL');
  const [step1Search, setStep1Search] = useState<string>('');
  const [step4ColorId, setStep4ColorId] = useState<string>('ALL');
  const [step4CatId, setStep4CatId] = useState<string>('ALL');
  const [step4Search, setStep4Search] = useState<string>('');
  const [lightboxTpl, setLightboxTpl] = useState<SignTemplate | null>(null);
  const [uploadingFieldKey, setUploadingFieldKey] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const idempotencyKeyRef = useRef<string>(`idem-${crypto.randomUUID()}`);

  // Selected entities for current active item
  const currentCategory = signCategories.find((c) => c.id === activeItem.sign_category_id);
  const currentStyle = signStyles.find((s) => s.id === activeItem.style_id);
  const currentTemplate = signTemplates.find((t) => t.id === activeItem.template_id);

  // Dynamic form fields for current sign category
  const activeCategoryFields = useMemo(
    () =>
      productFields
        .filter((f) => f.sign_category_id === activeItem.sign_category_id && f.is_active)
        .sort((a, b) => a.sort_order - b.sort_order),
    [productFields, activeItem.sign_category_id]
  );

  // Filtered templates for Step 3 (Filtered by chosen Sign Category & Style per PART 7)
  const matchingTemplates = useMemo(() => {
    return signTemplates.filter(
      (t) =>
        t.is_active &&
        t.status === 'published' &&
        (!activeItem.sign_category_id || t.sign_category_id === activeItem.sign_category_id) &&
        (!activeItem.style_id || t.style_id === activeItem.style_id)
    );
  }, [signTemplates, activeItem.sign_category_id, activeItem.style_id]);

  // Fallback templates if a newly added category doesn't have its own specific template yet (still filtered by style!)
  const displayedStep3Templates = useMemo(() => {
    if (matchingTemplates.length > 0) return matchingTemplates;
    return signTemplates.filter(
      (t) =>
        t.is_active &&
        t.status === 'published' &&
        (!activeItem.style_id || t.style_id === activeItem.style_id)
    );
  }, [matchingTemplates, signTemplates, activeItem.style_id]);

  // Filtered free decorations for Step 4
  const filteredDecorations = useMemo(() => {
    const q = step4Search.trim().toLowerCase();
    return decorations
      .filter((d) => d.is_active)
      .filter((d) => (step4ColorId === 'ALL' ? true : d.color_id === step4ColorId))
      .filter((d) => {
        if (step4CatId === 'ALL') return true;
        if (d.category_id === step4CatId) return true;
        // Also include child subcategories if a parent category is selected (hierarchical support!)
        const catObj = decorationCategories.find((c) => c.id === d.category_id);
        return catObj?.parent_id === step4CatId;
      })
      .filter((d) => !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q))
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [decorations, step4ColorId, step4CatId, step4Search, decorationCategories]);

  // Price calculation across all items in the order
  const pricing = useMemo(
    () =>
      calculateOrderPricing({
        draftItems: wizard.items,
        categories: signCategories,
        styles: signStyles,
        templates: signTemplates,
        promotions,
        promotionCode: wizard.promotion_code,
        serviceFee: siteSettings.contact_footer.service_fee ?? 0,
      }),
    [
      wizard.items,
      wizard.promotion_code,
      signCategories,
      signStyles,
      signTemplates,
      promotions,
      siteSettings.contact_footer.service_fee,
    ]
  );

  // Check if any item in the order contains sensitive fields (e.g., Bank Account sign)
  const hasSensitiveSign = useMemo(() => {
    return wizard.items.some((it) => {
      const cat = signCategories.find((c) => c.id === it.sign_category_id);
      return Boolean(cat?.requires_sensitive_review);
    });
  }, [wizard.items, signCategories]);

  // Validation helper before advancing steps
  const validateStepBeforeAdvance = (targetStep: number): boolean => {
    if (targetStep > 1 && !activeItem.sign_category_id) {
      toast.error('กรุณาเลือกประเภทป้ายในขั้นตอนที่ 1 ก่อนไปต่อ');
      setStep(1);
      return false;
    }
    if (targetStep > 2 && !activeItem.style_id) {
      toast.error('กรุณาเลือกสไตล์ป้าย (Minimal หรือ Decorative) ในขั้นตอนที่ 2');
      setStep(2);
      return false;
    }
    if (targetStep > 3 && !activeItem.template_id) {
      toast.error('กรุณาคลิกเลือกภาพเทมเพลตสำเร็จรูปในขั้นตอนที่ 3');
      setStep(3);
      return false;
    }
    if (targetStep > 5) {
      const missingFields = activeCategoryFields.filter((f) => {
        if (!f.is_required) return false;
        if (f.field_type === 'image_upload') {
          return !activeItem.field_files[f.field_key] && !activeItem.field_values[f.field_key];
        }
        return !activeItem.field_values[f.field_key]?.trim();
      });
      if (missingFields.length > 0) {
        toast.error(
          `กรุณากรอกข้อมูลที่จำเป็นให้ครบ: ${missingFields.map((f) => f.label).join(', ')}`
        );
        setStep(5);
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    const next = Math.min(7, wizard.current_step + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
    if (validateStepBeforeAdvance(next)) {
      setStep(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    const prev = Math.max(1, wizard.current_step - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
    setStep(prev);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageFieldUpload = async (fieldKey: string, file: File | undefined) => {
    if (!file) return;
    setUploadingFieldKey(fieldKey);
    try {
      const { storagePath, url } = await uploadFileToBucket(
        file,
        'customer-references',
        'wizard-refs'
      );
      setFieldFile(fieldKey, storagePath);
      setFieldValue(fieldKey, file.name || url);
      toast.success(`อัปโหลดไฟล์ "${file.name}" เรียบร้อยแล้ว`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'อัปโหลดไฟล์ไม่สำเร็จ');
    } finally {
      setUploadingFieldKey(null);
    }
  };

  const handleFinalConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingOrder) return; // Prevent double-click duplicate order

    // Validate all items in the order
    for (let i = 0; i < wizard.items.length; i++) {
      const item = wizard.items[i];
      if (!item.sign_category_id || !item.style_id || !item.template_id) {
        toast.error(`ป้ายใบที่ ${i + 1} ยังเลือกประเภทป้าย สไตล์ หรือเทมเพลตไม่ครบ`);
        setActiveItemIndex(i);
        setStep(1);
        return;
      }
      const reqFields = productFields.filter(
        (f) => f.sign_category_id === item.sign_category_id && f.is_active && f.is_required
      );
      for (const rf of reqFields) {
        const val = item.field_values[rf.field_key]?.trim();
        if (!val) {
          toast.error(`ป้ายใบที่ ${i + 1}: กรุณากรอก "${rf.label}" ให้ครบถ้วน`);
          setActiveItemIndex(i);
          setStep(5);
          return;
        }
      }
    }

    if (hasSensitiveSign && !wizard.sensitive_data_confirmed) {
      toast.error('กรุณาติ๊กยืนยันว่าได้ตรวจสอบเลขบัญชีและชื่อบัญชีถูกต้องแล้วก่อนส่งคำสั่งซื้อ');
      return;
    }

    if (wizard.customer_name.trim().length < 2) {
      toast.error('กรุณากรอกชื่อผู้สั่งซื้อ');
      return;
    }

    if (wizard.customer_contact.trim().length < 4) {
      toast.error('กรุณากรอกเบอร์โทรศัพท์หรือช่องทางติดต่อกลับ');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const confirmedOrder = await submitOrder({
        idempotency_key: idempotencyKeyRef.current,
        customer_name: wizard.customer_name,
        customer_contact: wizard.customer_contact,
        customer_email: wizard.customer_email,
        delivery_channel: wizard.delivery_channel,
        customer_note: wizard.customer_note,
        promotion_code: wizard.promotion_code,
        items: wizard.items,
      });

      setLastConfirmedOrder(confirmedOrder);
      resetWizard();
      // Generate fresh idempotency key for future orders
      idempotencyKeyRef.current = `idem-${crypto.randomUUID()}`;
      toast.success(`สร้างคำสั่งซื้อ ${confirmedOrder.order_number} สำเร็จ!`);
      navigate(`/order-confirmation/${confirmedOrder.order_number}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="wizard-shell mx-auto max-w-7xl space-y-6 px-3 py-8 sm:px-4">
      {/* Top Multi-Item Switcher & Order Progress Bar (PART 12) */}
      <div className="card-pastel relative overflow-hidden p-5 sm:p-6">
        <img
          src={SITE_DECORATIONS.mascots.bearPudding}
          alt=""
          className="pointer-events-none absolute -top-1 right-4 hidden h-14 w-14 rotate-6 object-contain opacity-90 xl:block"
        />
        <img
          src={SITE_DECORATIONS.sparkles.starBurst}
          alt=""
          className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 object-contain opacity-75"
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#F2E6DF] pb-4 xl:pr-14">
          <div className="flex items-center gap-3">
            <img
              src={SITE_DECORATIONS.bows.pinkBow}
              alt=""
              className="hidden h-8 w-8 object-contain sm:block"
            />
            <div>
              <h1 className="text-xl font-bold text-brand-brown sm:text-2xl">
                ระบบสั่งทำป้ายออนไลน์ (Custom Sign Order Wizard)
              </h1>
              <p className="text-xs text-brand-brown-soft">
                ข้อมูลทุกขั้นตอนถูกพักไว้ชั่วคราวอัตโนมัติ กดย้อนกลับเพื่อปรับเปลี่ยนได้ตลอดโดยข้อมูลไม่หาย
              </p>
            </div>
          </div>

          {/* Multi-Sign Tabs within the same order */}
          <div className="flex flex-wrap items-center gap-2">
            {wizard.items.map((item, idx) => {
              const cat = signCategories.find((c) => c.id === item.sign_category_id);
              const isCurrent = idx === wizard.active_item_index;
              return (
                <div key={item.draft_id} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveItemIndex(idx)}
                    className={`rounded-l-2xl px-3.5 py-2 text-xs font-bold transition ${
                      isCurrent
                        ? 'bg-brand-pink-dark text-white'
                        : 'border border-[#EAD9CE] bg-brand-cream text-brand-brown'
                    } ${wizard.items.length === 1 ? 'rounded-r-2xl' : ''}`}
                  >
                    ป้ายใบที่ {idx + 1}: {cat ? cat.name : 'กำลังเลือก...'}
                  </button>
                  {wizard.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSignItem(idx)}
                      className="rounded-r-2xl border border-l-0 border-[#EAD9CE] bg-rose-50 px-2 py-2 text-xs text-rose-600 hover:bg-rose-100"
                      title="ลบป้ายใบนี้ออกจากออเดอร์"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => addAnotherSignItem()}
              className="inline-flex items-center gap-1 rounded-2xl border border-dashed border-brand-pink-dark bg-brand-pink-light/40 px-3 py-2 text-xs font-bold text-brand-brown hover:bg-brand-pink-light"
            >
              <PlusCircle className="h-3.5 w-3.5 text-brand-pink-dark" />
              <span>+ เพิ่มป้ายอีกใบในออเดอร์นี้</span>
            </button>
          </div>
        </div>

        {/* 7-Step Progress Bar — each step paired with its matching cute sticker */}
        <div className="wizard-step-grid relative z-10 mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {WIZARD_STEPS.map((s) => {
            const isActive = wizard.current_step === s.step;
            const isCompleted = wizard.current_step > s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  if (s.step <= wizard.current_step || validateStepBeforeAdvance(s.step)) {
                    setStep(s.step);
                  }
                }}
                className={`relative flex items-center gap-2 overflow-hidden rounded-2xl p-2.5 pr-8 text-left transition ${
                  isActive
                    ? 'bg-brand-pink-dark text-white shadow-sm'
                    : isCompleted
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border border-transparent bg-brand-cream text-brand-brown-soft hover:border-[#EAD9CE]'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-white text-brand-pink-dark'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-brand-brown'
                  }`}
                >
                  {isCompleted ? '✓' : s.step}
                </span>
                <span className="truncate text-xs font-bold">{s.title}</span>
                <img
                  src={s.icon}
                  alt=""
                  className="pointer-events-none absolute right-1.5 top-1/2 h-6 w-6 -translate-y-1/2 object-contain opacity-90"
                />
              </button>
            );
          })}
        </div>

        {/* Live Selection Summary Strip */}
        <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#F0E2DA] bg-brand-cream px-4 py-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <img src={SITE_DECORATIONS.badges.stampSquare} alt="" className="h-3.5 w-3.5 object-contain" />
              <strong>ป้ายที่กำลังแก้ไข (ใบที่ {wizard.active_item_index + 1}):</strong>{' '}
              {currentCategory ? currentCategory.name : 'ยังไม่เลือกประเภท'}
            </span>
            <span>•</span>
            <span>
              <strong>สไตล์:</strong> {currentStyle ? currentStyle.name : 'ยังไม่เลือกสไตล์'}
            </span>
            <span>•</span>
            <span>
              <strong>เทมเพลต:</strong> {currentTemplate ? `${currentTemplate.code} (${currentTemplate.name})` : 'ยังไม่เลือก'}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
              <img src={SITE_DECORATIONS.mascots.rabbitCute} alt="" className="h-4 w-4 object-contain" />
              ของตกแต่งฟรีที่เลือก: {activeItem.decoration_ids.length} ชิ้น (0 บาท)
            </span>
          </div>
          <div className="inline-flex items-center gap-1 font-bold text-brand-pink-dark">
            <img src={SITE_DECORATIONS.sweets.miniHeart} alt="" className="h-3.5 w-3.5 object-contain" />
            ยอดรวมทั้งออเดอร์ ({wizard.items.length} ป้าย): {formatTHB(pricing.grand_total)}
          </div>
        </div>
      </div>

      {/* =====================================================================
          STEP 1: เลือกประเภทป้าย (PART 6)
         ===================================================================== */}
      {wizard.current_step === 1 && (
        <div className="space-y-6">
          <div className="card-pastel relative overflow-hidden p-6">
            <img
              src={SITE_DECORATIONS.mascots.toastEggSmile}
              alt=""
              className="pointer-events-none absolute right-4 top-3 hidden h-14 w-14 rotate-6 object-contain opacity-90 lg:block"
            />
            <img
              src={SITE_DECORATIONS.bows.miniBow}
              alt=""
              className="pointer-events-none absolute right-20 top-3 hidden h-6 w-6 -rotate-6 object-contain opacity-85 lg:block"
            />
            <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center lg:pr-20">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-brand-brown">
                  <img src={SITE_DECORATIONS.mascots.toastEggSmile} alt="" className="h-7 w-7 object-contain lg:hidden" />
                  <span>Step 1: เลือกประเภทป้าย (สำหรับป้ายใบที่ {wizard.active_item_index + 1})</span>
                </h2>
                <p className="text-sm text-brand-brown-soft">
                  เลือกประเภทป้ายที่ต้องการจากฐานข้อมูล คลิกเลือกเพื่อไปขั้นตอนเลือกสไตล์ทันที
                </p>
              </div>
              <div className="relative w-full md:w-72">
                <input
                  type="search"
                  value={step1Search}
                  onChange={(e) => setStep1Search(e.target.value)}
                  placeholder="ค้นหาประเภทป้าย..."
                  className="input-pastel !py-2 pl-9 text-sm"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-brown-soft" />
              </div>
            </div>

            <div className="relative z-10 mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStep1Group('ALL')}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold ${
                  step1Group === 'ALL'
                    ? 'bg-brand-pink-dark text-white'
                    : 'bg-brand-cream text-brand-brown'
                }`}
              >
                ทุกหมวดหมู่
              </button>
              {categoryGroups
                .filter((g) => g.is_active)
                .map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setStep1Group(g.id)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold ${
                      step1Group === g.id
                        ? 'bg-brand-pink-dark text-white'
                        : 'bg-brand-cream text-brand-brown'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {signCategories
              .filter((c) => c.is_active)
              .filter((c) => (step1Group === 'ALL' ? true : c.group_id === step1Group))
              .filter(
                (c) =>
                  !step1Search.trim() ||
                  c.name.toLowerCase().includes(step1Search.trim().toLowerCase()) ||
                  c.short_description.toLowerCase().includes(step1Search.trim().toLowerCase())
              )
              .map((cat, idx) => {
                const isSelected = activeItem.sign_category_id === cat.id;
                const preset = CATEGORY_DECOR_PRESETS[idx % CATEGORY_DECOR_PRESETS.length];
                return (
                  <div
                    key={cat.id}
                    onClick={() => selectSignCategory(cat.id, true)}
                    className={`card-pastel card-pastel-hover group relative flex cursor-pointer flex-col overflow-hidden ${
                      isSelected ? 'border-brand-pink-dark ring-2 ring-brand-pink-dark' : ''
                    }`}
                  >
                    <div className="relative aspect-[16/10] bg-brand-cream p-3">
                      <img
                        src={cat.preview_image_url}
                        alt={cat.name}
                        className="h-full w-full rounded-2xl object-cover"
                      />
                      <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-brown shadow-sm">
                        <img src={preset.pin} alt="" className="h-3.5 w-3.5 object-contain" />
                        เริ่มต้น {formatTHB(cat.base_price)}
                      </span>
                      {isSelected && (
                        <span className="absolute right-5 top-5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                          Selected ✓
                        </span>
                      )}
                      <img
                        src={preset.primary}
                        alt=""
                        className="pointer-events-none absolute bottom-4 right-4 h-11 w-11 rotate-3 object-contain drop-shadow-md transition-transform group-hover:scale-110"
                      />
                    </div>
                    <div className="relative flex flex-1 flex-col justify-between p-5">
                      <img
                        src={preset.secondary}
                        alt=""
                        className="pointer-events-none absolute right-4 top-4 h-5 w-5 object-contain opacity-80"
                      />
                      <div className="pr-6">
                        <span className="text-xs text-brand-brown-soft">
                          {cat.group_name} • <span className="font-semibold text-brand-pink-dark">{preset.themeLabel}</span>
                        </span>
                        <h3 className="mt-1 text-lg font-bold text-brand-brown">{cat.name}</h3>
                        <p className="mt-1 text-xs text-brand-brown-soft">{cat.short_description}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-[#F2E6DF] pt-3">
                        <span className="text-sm font-bold text-brand-pink-dark">
                          {formatTHB(cat.base_price)}
                        </span>
                        <span className="btn-primary !px-4 !py-2 text-xs">
                          {isSelected ? 'เลือกแล้ว (ไปต่อ)' : 'เลือกประเภทนี้'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* =====================================================================
          STEP 2: เลือกสไตล์ (Minimal / Decorative) (PART 7)
         ===================================================================== */}
      {wizard.current_step === 2 && (
        <div className="space-y-6">
          <div className="card-pastel relative overflow-hidden p-6 pr-20">
            <img
              src={SITE_DECORATIONS.sweets.twinCreamBuns}
              alt=""
              className="pointer-events-none absolute right-4 top-2.5 h-14 w-14 object-contain opacity-95"
            />
            <h2 className="text-xl font-bold text-brand-brown">
              Step 2: เลือกสไตล์งานออกแบบสำหรับ "{currentCategory?.name}"
            </h2>
            <p className="text-sm text-brand-brown-soft">
              ระบบจะกรองเฉพาะเทมเพลตที่ตรงกับประเภทป้ายและสไตล์ที่คุณเลือก (หากเปลี่ยนสไตล์ภายหลัง ระบบจะแจ้งเตือนหากเทมเพลตเดิมไม่ตรงสไตล์)
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {signStyles
              .filter((s) => s.is_active)
              .map((style) => {
                const isSelected = activeItem.style_id === style.id;
                const estPrice = (currentCategory?.base_price ?? 59) + style.price_modifier;
                const isMinimal = style.code === 'MIN';
                const styleMascot = isMinimal
                  ? SITE_DECORATIONS.mascots.mascotToast
                  : SITE_DECORATIONS.sweets.pancakeTower;
                const styleAccent = isMinimal
                  ? SITE_DECORATIONS.sweets.creamPuffBerry
                  : SITE_DECORATIONS.sweets.pinkCupcakeStar;

                return (
                  <div
                    key={style.id}
                    onClick={() => selectStyle(style.id, true)}
                    className={`card-pastel card-pastel-hover group relative flex cursor-pointer flex-col justify-between overflow-hidden p-6 ${
                      isSelected ? 'border-brand-pink-dark bg-brand-pink-light/15 ring-2 ring-brand-pink-dark' : ''
                    }`}
                  >
                    <img
                      src={isMinimal ? SITE_DECORATIONS.bows.miniBow : SITE_DECORATIONS.bows.pinkBow}
                      alt=""
                      className="pointer-events-none absolute right-5 top-2 z-20 h-8 w-8 rotate-6 object-contain"
                    />
                    <img
                      src={styleAccent}
                      alt=""
                      className="pointer-events-none absolute bottom-20 right-4 h-12 w-12 -rotate-6 object-contain opacity-90"
                    />

                    <div>
                      <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-2xl bg-brand-cream">
                        <img
                          src={style.preview_image_url}
                          alt={style.name}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute left-4 top-4 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-brand-brown shadow-sm">
                          {style.price_modifier === 0
                            ? 'ราคาเพิ่ม +0 บาท'
                            : `ราคาเพิ่ม +${formatTHB(style.price_modifier)}`}
                        </span>
                        {isSelected && (
                          <span className="absolute right-4 top-4 rounded-full bg-emerald-600 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
                            Selected ✓
                          </span>
                        )}
                        <img
                          src={styleMascot}
                          alt=""
                          className="pointer-events-none absolute bottom-3 left-3 h-14 w-14 object-contain drop-shadow-md"
                        />
                      </div>

                      <h3 className="text-2xl font-bold text-brand-brown">{style.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-brand-pink-dark">
                        {style.tagline}
                      </p>
                      <p className="mt-2 pr-12 text-sm text-brand-brown-soft">{style.description}</p>

                      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {style.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs font-medium text-brand-brown">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-[#F2E6DF] pt-4">
                      <div>
                        <span className="block text-xs text-brand-brown-soft">
                          ราคาป้ายเมื่อเลือกสไตล์นี้
                        </span>
                        <span className="text-xl font-bold text-brand-pink-dark">
                          {formatTHB(estPrice)}
                        </span>
                      </div>
                      <span className="btn-primary text-sm">
                        {isSelected ? 'เลือกสไตล์นี้แล้ว →' : `เลือกสไตล์ ${style.code}`}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* =====================================================================
          STEP 3: เลือกเทมเพลตสำเร็จรูป (PART 8)
         ===================================================================== */}
      {wizard.current_step === 3 && (
        <div className="space-y-6">
          <div className="card-pastel relative overflow-hidden p-6 pr-20">
            <img
              src={SITE_DECORATIONS.sweets.cherryCreamTart}
              alt=""
              className="pointer-events-none absolute right-4 top-2.5 h-14 w-14 object-contain opacity-95"
            />
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-brand-brown">
                  Step 3: เลือกภาพเทมเพลตสำเร็จรูป (สไตล์ {currentStyle?.name})
                </h2>
                <p className="text-sm text-brand-brown-soft">
                  เลือกโครงเทมเพลตตัวอย่างที่ชอบ (สามารถกดปุ่ม "ดูภาพขนาดใหญ่" เพื่อซูมดูรายละเอียด)
                </p>
              </div>
              {matchingTemplates.length === 0 && (
                <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
                  แสดงเทมเพลตทั้งหมดในสไตล์ {currentStyle?.code} เพื่อใช้เป็นโครงต้นแบบสำหรับ "{currentCategory?.name}"
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {displayedStep3Templates.map((tpl, idx) => {
              const isSelected = activeItem.template_id === tpl.id;
              const accent = TEMPLATE_CARD_ACCENTS[idx % TEMPLATE_CARD_ACCENTS.length];
              return (
                <div
                  key={tpl.id}
                  className={`card-pastel card-pastel-hover group relative flex flex-col overflow-hidden ${
                    isSelected ? 'border-emerald-600 bg-emerald-50/20 ring-2 ring-emerald-600' : ''
                  }`}
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
                    {isSelected && (
                      <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                      </span>
                    )}
                    <img
                      src={accent.badge}
                      alt=""
                      className="pointer-events-none absolute bottom-4 right-4 h-9 w-9 object-contain drop-shadow-sm transition-transform group-hover:scale-110"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3 className="font-bold text-brand-brown">{tpl.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-brand-brown-soft">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-[#F2E6DF] pt-3">
                      <button
                        type="button"
                        onClick={() => setLightboxTpl(tpl)}
                        className="btn-secondary flex-1 !px-3 !py-2 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" /> ดูภาพใหญ่
                      </button>
                      <button
                        type="button"
                        onClick={() => selectTemplate(tpl.id, true)}
                        className={`flex-1 rounded-2xl px-3 py-2 text-xs font-bold text-white transition ${
                          isSelected ? 'bg-emerald-600' : 'bg-brand-pink-dark hover:opacity-95'
                        }`}
                      >
                        {isSelected ? 'Selected ✓' : 'เลือกเทมเพลต'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          STEP 4: เลือกของตกแต่งฟรี (PART 9: 9 หมวดสี + หมวดย่อย + ฟรี 0 บาททุกชิ้น)
         ===================================================================== */}
      {wizard.current_step === 4 && (
        <div className="space-y-6">
          <div className="card-pastel relative space-y-5 overflow-hidden p-6">
            <img
              src={SITE_DECORATIONS.mascots.rabbitCute}
              alt=""
              className="pointer-events-none absolute right-5 top-3 hidden h-16 w-16 rotate-3 object-contain opacity-95 lg:block"
            />
            <img
              src={SITE_DECORATIONS.bows.pinkBow}
              alt=""
              className="pointer-events-none absolute right-24 top-3 hidden h-8 w-8 -rotate-6 object-contain opacity-90 lg:block"
            />

            <div className="relative z-10 flex flex-col justify-between gap-3 md:flex-row md:items-center lg:pr-24">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  <Gift className="h-3.5 w-3.5" /> ของตกแต่งทั้งหมด ฟรี 0 บาท!
                  <img src={SITE_DECORATIONS.sweets.miniHeart} alt="" className="h-3.5 w-3.5 object-contain" />
                </div>
                <h2 className="mt-2 text-xl font-bold text-brand-brown">
                  Step 4: เลือกของตกแต่งพาสเทลฟรี (เลือกได้หลายชิ้น หลายสี ไม่บวกเพิ่ม)
                </h2>
                <p className="text-sm text-brand-brown-soft">
                  เลือกสีหลัก → เลือกหมวดย่อย (เช่น โบว์ ดอกไม้ หัวใจ ดาว) → คลิกเลือกชิ้นที่ชอบได้ไม่จำกัด หรือข้ามขั้นตอนนี้ได้หากต้องการแบบคลีน
                </p>
              </div>

              <div className="relative w-full md:w-64">
                <input
                  type="search"
                  value={step4Search}
                  onChange={(e) => setStep4Search(e.target.value)}
                  placeholder="ค้นหา เช่น โบว์ชมพู, ดาว..."
                  className="input-pastel !py-2 pl-9 text-sm"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-brown-soft" />
              </div>
            </div>

            {/* 1. Filter by Color (9 Colors) */}
            <div className="relative z-10">
              <p className="mb-2 text-xs font-bold text-brand-brown">1. เลือกหมวดสีของตกแต่ง:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStep4ColorId('ALL')}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    step4ColorId === 'ALL'
                      ? 'bg-brand-brown text-white'
                      : 'border border-[#EAD9CE] bg-brand-cream text-brand-brown'
                  }`}
                >
                  ทุกสี ({decorations.filter((d) => d.is_active).length})
                </button>
                {decorationColors
                  .filter((c) => c.is_active)
                  .map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setStep4ColorId(col.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                        step4ColorId === col.id
                          ? 'bg-brand-pink-dark text-white shadow-sm'
                          : 'border border-[#EAD9CE] bg-white text-brand-brown hover:bg-brand-pink-light/30'
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/15"
                        style={{ backgroundColor: col.hex_code }}
                      />
                      <span>{col.name}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* 2. Filter by Subcategory (Supports Parent & Nested Subcategories) */}
            <div className="relative z-10">
              <p className="mb-2 text-xs font-bold text-brand-brown">
                2. เลือกหมวดย่อยประเภทของตกแต่ง:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStep4CatId('ALL')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    step4CatId === 'ALL'
                      ? 'bg-brand-pink-dark text-white'
                      : 'bg-brand-cream text-brand-brown'
                  }`}
                >
                  ทุกหมวดย่อย
                </button>
                {decorationCategories
                  .filter((c) => c.is_active)
                  .map((cat) => {
                    const parent = cat.parent_id
                      ? decorationCategories.find((p) => p.id === cat.parent_id)
                      : null;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setStep4CatId(cat.id)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                          step4CatId === cat.id
                            ? 'bg-brand-pink-dark text-white'
                            : 'bg-brand-cream text-brand-brown hover:bg-brand-pink-light/50'
                        }`}
                      >
                        {parent ? `${parent.name} › ${cat.name}` : cat.name}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Selected Decorations Tray (with Remove buttons) */}
            <div className="relative z-10 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 pr-14">
              <img
                src={SITE_DECORATIONS.mascots.mascotDonut}
                alt=""
                className="pointer-events-none absolute bottom-1.5 right-2 h-11 w-11 object-contain opacity-90"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-900">
                  รายการของตกแต่งที่เลือกไว้สำหรับป้ายใบนี้ ({activeItem.decoration_ids.length} ชิ้น — รวม 0 บาท):
                </span>
                {activeItem.decoration_ids.length > 0 && (
                  <button
                    type="button"
                    onClick={clearDecorationsForActiveItem}
                    className="text-xs font-semibold text-rose-600 underline"
                  >
                    ล้างของตกแต่งทั้งหมดของป้ายนี้
                  </button>
                )}
              </div>

              {activeItem.decoration_ids.length === 0 ? (
                <p className="mt-1.5 text-xs text-emerald-800">
                  ยังไม่ได้เลือกของตกแต่งเพิ่ม (สามารถคลิกเลือกจากการ์ดด้านล่างได้เลย หรือกดข้ามไปขั้นตอนกรอกข้อความได้ค่ะ)
                </p>
              ) : (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {activeItem.decoration_ids.map((decId) => {
                    const dec = decorations.find((d) => d.id === decId);
                    if (!dec) return null;
                    const col = decorationColors.find((c) => c.id === dec.color_id);
                    const sub = decorationCategories.find((c) => c.id === dec.category_id);
                    return (
                      <span
                        key={dec.id}
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-brand-brown shadow-sm"
                      >
                        <img src={dec.image_url} alt={dec.name} className="h-4 w-4 rounded-full" />
                        <span>
                          {col?.name} › {sub?.name} › {dec.name}
                        </span>
                        <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                          FREE
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleDecorationSelection(dec.id)}
                          className="text-rose-600 hover:font-bold"
                          title="นำออก"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Decorations Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredDecorations.map((dec) => {
              const col = decorationColors.find((c) => c.id === dec.color_id);
              const sub = decorationCategories.find((c) => c.id === dec.category_id);
              const isSelected = activeItem.decoration_ids.includes(dec.id);

              return (
                <div
                  key={dec.id}
                  onClick={() => toggleDecorationSelection(dec.id)}
                  className={`card-pastel card-pastel-hover flex cursor-pointer flex-col justify-between p-3.5 ${
                    isSelected ? 'border-emerald-600 bg-emerald-50/25 ring-2 ring-emerald-600' : ''
                  }`}
                >
                  <div>
                    <div className="relative aspect-square rounded-2xl bg-brand-cream p-2">
                      <img
                        src={dec.image_url}
                        alt={dec.name}
                        className="h-full w-full rounded-xl object-contain"
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        FREE 0฿
                      </span>
                      {isSelected && (
                        <span className="absolute right-2 top-2 rounded-full bg-brand-pink-dark px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          Selected ✓
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5">
                      <p className="text-[11px] font-medium text-brand-brown-soft">
                        สี{col?.name} • {sub?.name}
                      </p>
                      <h3 className="mt-0.5 line-clamp-1 text-xs font-bold text-brand-brown">
                        {dec.name}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`mt-3 w-full rounded-xl py-1.5 text-xs font-bold transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-brand-pink-light text-brand-brown hover:bg-brand-pink'
                    }`}
                  >
                    {isSelected ? 'เลือกแล้ว (คลิกเพื่อนำออก)' : '+ เลือกของตกแต่ง (ฟรี)'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          STEP 5: กรอกรายละเอียดป้าย Dynamic Form (PART 10)
         ===================================================================== */}
      {wizard.current_step === 5 && (
        <div className="card-pastel relative space-y-6 overflow-hidden p-6 sm:p-8">
          <img
            src={SITE_DECORATIONS.mascots.honeyBearBottle}
            alt=""
            className="pointer-events-none absolute right-5 top-3 hidden h-16 w-16 rotate-6 object-contain opacity-95 sm:block"
          />
          <img
            src={SITE_DECORATIONS.bows.pinkBow}
            alt=""
            className="pointer-events-none absolute right-24 top-3 hidden h-8 w-8 -rotate-6 object-contain opacity-85 sm:block"
          />
          <div className="border-b border-[#F2E6DF] pb-4 sm:pr-24">
            <h2 className="text-xl font-bold text-brand-brown">
              Step 5: กรอกรายละเอียดข้อความสำหรับ "{currentCategory?.name}"
            </h2>
            <p className="text-sm text-brand-brown-soft">
              ระบบปรับเปลี่ยนช่องกรอกข้อมูลตามประเภทป้ายอัตโนมัติ ข้อมูลส่วนตัวของลูกค้าจะถูกเก็บเป็นความลับและไม่แสดงในหน้าสาธารณะ
            </p>
          </div>

          {currentCategory?.requires_sensitive_review && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-bold">ป้ายนี้มีข้อมูลสำคัญ (เช่น เลขบัญชีธนาคาร / ช่องทางรับเงิน)</p>
                <p className="mt-0.5">
                  กรุณาตรวจทานตัวเลขและตัวสะกดชื่อบัญชีให้ถูกต้อง ระบบจะแสดงข้อมูลนี้ให้คุณตรวจสอบอีกครั้งในขั้นตอนสรุปก่อนยืนยันคำสั่งซื้อ และจะไม่เปิดเผยข้อมูลนี้ต่อสาธารณะโดยอัตโนมัติ
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {activeCategoryFields.map((field) => {
              const currentValue = activeItem.field_values[field.field_key] ?? '';
              const currentFile = activeItem.field_files[field.field_key] ?? '';

              return (
                <div
                  key={field.id}
                  className={
                    field.field_type === 'textarea' || field.field_type === 'image_upload'
                      ? 'md:col-span-2'
                      : ''
                  }
                >
                  <label className="mb-1.5 block text-sm font-bold text-brand-brown">
                    {field.label}{' '}
                    {field.is_required ? (
                      <span className="text-rose-600">*จำเป็น</span>
                    ) : (
                      <span className="text-xs font-normal text-brand-brown-soft">(ไม่บังคับ)</span>
                    )}
                  </label>

                  {field.field_type === 'text' && (
                    <input
                      type="text"
                      value={currentValue}
                      onChange={(e) => setFieldValue(field.field_key, e.target.value)}
                      placeholder={field.placeholder}
                      className="input-pastel"
                    />
                  )}

                  {field.field_type === 'number' && (
                    <input
                      type="number"
                      value={currentValue}
                      onChange={(e) => setFieldValue(field.field_key, e.target.value)}
                      placeholder={field.placeholder}
                      className="input-pastel"
                    />
                  )}

                  {field.field_type === 'date' && (
                    <input
                      type="date"
                      value={currentValue}
                      onChange={(e) => setFieldValue(field.field_key, e.target.value)}
                      className="input-pastel"
                    />
                  )}

                  {field.field_type === 'time' && (
                    <input
                      type="time"
                      value={currentValue}
                      onChange={(e) => setFieldValue(field.field_key, e.target.value)}
                      className="input-pastel"
                    />
                  )}

                  {field.field_type === 'textarea' && (
                    <textarea
                      rows={3}
                      value={currentValue}
                      onChange={(e) => setFieldValue(field.field_key, e.target.value)}
                      placeholder={field.placeholder}
                      className="input-pastel"
                    />
                  )}

                  {field.field_type === 'select' && (
                    <select
                      value={currentValue}
                      onChange={(e) => setFieldValue(field.field_key, e.target.value)}
                      className="input-pastel"
                    >
                      <option value="">-- {field.placeholder || 'กรุณาเลือก'} --</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.field_type === 'checkbox' && (
                    <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-2xl border border-[#EAD9CE] bg-brand-cream px-4 py-3 text-sm font-medium text-brand-brown">
                      <input
                        type="checkbox"
                        checked={currentValue === 'true'}
                        onChange={(e) =>
                          setFieldValue(field.field_key, e.target.checked ? 'true' : 'false')
                        }
                        className="h-4 w-4 rounded accent-brand-pink-dark"
                      />
                      <span>ต้องการระบุรายการนี้ลงในป้าย</span>
                    </label>
                  )}

                  {field.field_type === 'image_upload' && (
                    <div className="rounded-2xl border-2 border-dashed border-[#EAD9CE] bg-brand-cream p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Upload className="h-5 w-5 text-brand-pink-dark" />
                          <div className="text-xs">
                            <p className="font-bold text-brand-brown">
                              อัปโหลดไฟล์อ้างอิงไปยัง Bucket ส่วนตัว (customer-references)
                            </p>
                            <p className="text-brand-brown-soft">
                              รองรับไฟล์ PNG, JPG, WEBP ขนาดไม่เกิน 5 MB (ไม่เปิดเผยต่อสาธารณะ)
                            </p>
                          </div>
                        </div>
                        <label className="btn-secondary !py-2 !px-4 cursor-pointer text-xs">
                          <span>
                            {uploadingFieldKey === field.field_key
                              ? 'กำลังอัปโหลด...'
                              : 'เลือกไฟล์รูปภาพ'}
                          </span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) =>
                              void handleImageFieldUpload(field.field_key, e.target.files?.[0])
                            }
                          />
                        </label>
                      </div>
                      {(currentFile || currentValue) && (
                        <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                          ✓ แนบไฟล์แล้ว: {currentValue || currentFile} (Path: {currentFile || 'ready'})
                        </p>
                      )}
                    </div>
                  )}

                  {field.help_text && (
                    <p className="mt-1 text-xs text-brand-brown-soft">{field.help_text}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quantity & Item Note */}
          <div className="grid gap-4 border-t border-[#F2E6DF] pt-5 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-brand-brown">
                จำนวนชิ้น/เซ็ต สำหรับป้ายใบนี้
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={activeItem.quantity}
                onChange={(e) => setItemQuantity(Number(e.target.value))}
                className="input-pastel !py-2.5 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-brand-brown">
                บรีฟเพิ่มเติมสำหรับนักออกแบบ (เฉพาะป้ายใบนี้)
              </label>
              <input
                type="text"
                value={activeItem.item_note}
                onChange={(e) => setItemNote(e.target.value)}
                placeholder="เช่น ขอเน้นตัวหนังสือชื่อร้านใหญ่ ๆ หรือจัดวางโบว์ไว้มุมขวาบน..."
                className="input-pastel !py-2.5 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STEP 6: ตรวจสอบราคาและสรุปรายการรายป้าย (PART 11 & PART 12)
         ===================================================================== */}
      {wizard.current_step === 6 && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <div className="card-pastel relative overflow-hidden p-6">
              <img
                src={SITE_DECORATIONS.sweets.pinkSyrupPancakes}
                alt=""
                className="pointer-events-none absolute right-4 top-2 hidden h-14 w-14 object-contain opacity-90 sm:block"
              />
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 sm:pr-16">
                <div>
                  <h2 className="text-xl font-bold text-brand-brown">
                    Step 6: ตรวจสอบรายละเอียดและราคาแยกตามรายป้าย
                  </h2>
                  <p className="text-xs text-brand-brown-soft">
                    สูตรคำนวณ: ราคาฐานของประเภทป้าย + ราคาเพิ่มของสไตล์ + ของตกแต่งทุกชิ้นฟรี 0 บาท
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addAnotherSignItem()}
                  className="btn-soft text-xs font-bold"
                >
                  + สั่งป้ายประเภทอื่นเพิ่มในออเดอร์เดียวกัน
                </button>
              </div>
            </div>

            {wizard.items.map((item, idx) => {
              const cat = signCategories.find((c) => c.id === item.sign_category_id);
              const style = signStyles.find((s) => s.id === item.style_id);
              const tpl = signTemplates.find((t) => t.id === item.template_id);
              const breakdown = pricing.items[idx];
              const catFields = productFields.filter(
                (f) => f.sign_category_id === item.sign_category_id && f.is_active
              );
              const itemPreset = CATEGORY_DECOR_PRESETS[idx % CATEGORY_DECOR_PRESETS.length];

              return (
                <div key={item.draft_id} className="card-pastel relative space-y-4 overflow-hidden p-6">
                  <img
                    src={itemPreset.primary}
                    alt=""
                    className="pointer-events-none absolute bottom-3 right-3 h-12 w-12 object-contain opacity-85"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F2E6DF] pb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-pink-dark text-xs font-bold text-white">
                        #{idx + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-brand-brown">
                          {cat?.name ?? 'ยังไม่เลือกประเภทป้าย'} — สไตล์ {style?.name ?? '-'}
                        </h3>
                        <p className="text-xs text-brand-brown-soft">
                          เทมเพลต: <strong>{tpl?.code}</strong> ({tpl?.name})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveItemIndex(idx);
                          setStep(1);
                        }}
                        className="btn-secondary !px-3 !py-1.5 text-xs"
                      >
                        แก้ไขป้ายนี้
                      </button>
                      {wizard.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSignItem(idx)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
                        >
                          ลบรายการ
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Entered Fields Preview */}
                  <div className="space-y-2 rounded-2xl bg-brand-cream p-4">
                    <p className="text-xs font-bold text-brand-brown">ข้อความที่กรอกในป้ายนี้:</p>
                    <div className="grid gap-2 text-xs sm:grid-cols-2">
                      {catFields.map((f) => {
                        const val = item.field_values[f.field_key] || '-';
                        return (
                          <div
                            key={f.id}
                            className={`rounded-xl p-2.5 ${
                              f.is_sensitive
                                ? 'border-2 border-amber-300 bg-amber-50'
                                : 'border border-[#EAD9CE] bg-white'
                            }`}
                          >
                            <span className="block text-[11px] text-brand-brown-soft">
                              {f.label} {f.is_sensitive && '🔒 (โปรดตรวจทานความถูกต้อง)'}:
                            </span>
                            <strong className="break-words text-sm text-brand-brown">{val}</strong>
                          </div>
                        );
                      })}
                    </div>
                    {item.item_note && (
                      <p className="pt-1 text-xs text-brand-brown-soft">
                        <strong>หมายเหตุป้ายนี้:</strong> {item.item_note}
                      </p>
                    )}
                  </div>

                  {/* Chosen Free Decorations */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-brand-brown">
                      ของตกแต่งฟรีที่เลือก ({item.decoration_ids.length} ชิ้น):
                    </span>
                    {item.decoration_ids.length === 0 ? (
                      <span className="text-brand-brown-soft">ไม่ได้เลือกของตกแต่งเพิ่ม (0 บาท)</span>
                    ) : (
                      item.decoration_ids.map((dId) => {
                        const dec = decorations.find((d) => d.id === dId);
                        return dec ? (
                          <span
                            key={dId}
                            className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-900"
                          >
                            {dec.name} (ฟรี 0฿)
                          </span>
                        ) : null;
                      })
                    )}
                  </div>

                  {/* Line Item Price Formula */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F2E6DF] pt-3 pr-12 text-xs">
                    <div className="text-brand-brown-soft">
                      ราคาฐาน {formatTHB(breakdown.base_price)} + สไตล์ {style?.code}{' '}
                      {formatTHB(breakdown.style_price)} + ของตกแต่ง {breakdown.decorations_count} ชิ้น{' '}
                      <strong className="text-emerald-700">ฟรี (0 บาท)</strong> × {breakdown.quantity}
                    </div>
                    <div className="text-base font-bold text-brand-pink-dark">
                      รวมป้ายนี้: {formatTHB(breakdown.line_total)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Summary & Promo Code */}
          <div className="space-y-4 lg:col-span-4">
            <div className="card-pastel sticky top-24 relative space-y-4 overflow-hidden p-6">
              <img
                src={SITE_DECORATIONS.sweets.custardPuddingSpoon}
                alt=""
                className="pointer-events-none absolute right-4 top-3 h-12 w-12 object-contain opacity-95"
              />
              <h3 className="flex items-center gap-2 pr-12 text-lg font-bold text-brand-brown">
                <img src={SITE_DECORATIONS.bows.miniBow} alt="" className="h-5 w-5 object-contain" />
                สรุปยอดคำนวณราคา
              </h3>

              <div className="space-y-2 text-sm">
                {pricing.items.map((it, idx) => (
                  <div key={it.draft_id} className="flex justify-between text-xs">
                    <span className="text-brand-brown-soft">
                      #{idx + 1} {it.sign_category_name} ({it.template_code})
                    </span>
                    <span className="font-semibold text-brand-brown">{formatTHB(it.line_total)}</span>
                  </div>
                ))}

                <div className="flex justify-between border-t border-[#F2E6DF] pt-2 text-xs text-emerald-700">
                  <span>ค่าของตกแต่งพาสเทลทั้งหมด</span>
                  <span className="font-bold">ฟรี 0 บาท</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-brand-brown-soft">ยอดรวมรายการป้าย</span>
                  <span className="font-bold text-brand-brown">{formatTHB(pricing.subtotal)}</span>
                </div>

                {pricing.service_fee > 0 && (
                  <div className="flex justify-between text-sm text-brand-brown">
                    <span className="text-brand-brown-soft">ค่าบริการเพิ่มเติม</span>
                    <span className="font-bold">+{formatTHB(pricing.service_fee)}</span>
                  </div>
                )}

                {pricing.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-700">
                    <span>ส่วนลดโปรโมชั่น ({pricing.applied_promotion?.code})</span>
                    <span className="font-bold">-{formatTHB(pricing.discount_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-[#E6D7CD] pt-3 text-lg font-bold">
                  <span className="text-brand-brown">ยอดสุทธิทั้งหมด</span>
                  <span className="text-brand-pink-dark">{formatTHB(pricing.grand_total)}</span>
                </div>
              </div>

              {/* Promotion Code Input */}
              <div className="space-y-2 border-t border-[#F2E6DF] pt-4">
                <label className="block text-xs font-bold text-brand-brown">
                  <Tag className="mr-1 inline h-3.5 w-3.5 text-brand-pink-dark" />
                  โค้ดส่วนลดโปรโมชั่น (เช่น PASTEL10, SETSAVE15)
                </label>
                <input
                  type="text"
                  value={wizard.promotion_code}
                  onChange={(e) => setPromotionCode(e.target.value)}
                  placeholder="กรอกรหัสโค้ดส่วนลด..."
                  className="input-pastel !py-2 text-xs uppercase"
                />
                {pricing.promotion_message && (
                  <p
                    className={`text-xs font-medium ${
                      pricing.applied_promotion ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {pricing.promotion_message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep(7)}
                className="btn-primary w-full !py-3.5 text-sm font-bold"
              >
                ไปขั้นตอนที่ 7: กรอกข้อมูลติดต่อ &amp; ยืนยัน →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STEP 7: กรอกข้อมูลติดต่อและยืนยันคำสั่งซื้อ (PART 13)
         ===================================================================== */}
      {wizard.current_step === 7 && (
        <form onSubmit={handleFinalConfirmOrder} className="grid gap-6 lg:grid-cols-12">
          <div className="card-pastel relative space-y-5 overflow-hidden p-6 sm:p-8 lg:col-span-7">
            <img
              src={SITE_DECORATIONS.mascots.bumbleBee}
              alt=""
              className="pointer-events-none absolute right-5 top-3 hidden h-14 w-14 rotate-6 object-contain opacity-95 sm:block"
            />
            <div className="sm:pr-16">
              <h2 className="text-xl font-bold text-brand-brown">
                Step 7: กรอกข้อมูลผู้สั่งซื้อและช่องทางรับไฟล์งาน
              </h2>
              <p className="text-sm text-brand-brown-soft">
                กรุณาระบุช่องทางติดต่อที่สะดวก เพื่อให้ทางร้านส่งดราฟต์แบบป้ายและส่งมอบไฟล์งานจริง
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-bold text-brand-brown">
                  ชื่อผู้สั่งซื้อ / ชื่อลูกค้า <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={wizard.customer_name}
                  onChange={(e) => setCustomerInfo({ customer_name: e.target.value })}
                  placeholder="เช่น คุณแพรว (ร้าน Bunny Shop)"
                  className="input-pastel"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-brand-brown">
                  เบอร์โทรศัพท์ หรือ LINE ID สำหรับติดต่อ <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={wizard.customer_contact}
                  onChange={(e) => setCustomerInfo({ customer_contact: e.target.value })}
                  placeholder="เช่น 081-234-5678 (ใช้ยืนยันตอนเช็กสถานะออเดอร์)"
                  className="input-pastel"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-brand-brown">
                  อีเมล <span className="text-xs font-normal text-brand-brown-soft">(ไม่บังคับ)</span>
                </label>
                <input
                  type="email"
                  value={wizard.customer_email}
                  onChange={(e) => setCustomerInfo({ customer_email: e.target.value })}
                  placeholder="example@email.com"
                  className="input-pastel"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-brand-brown">
                  ช่องทางรับงานหลัก <span className="text-rose-600">*</span>
                </label>
                <select
                  value={wizard.delivery_channel}
                  onChange={(e) => setCustomerInfo({ delivery_channel: e.target.value })}
                  className="input-pastel"
                >
                  <option value="LINE Official">LINE Official Account</option>
                  <option value="Instagram DM">Instagram DM</option>
                  <option value="Facebook Messenger">Facebook Messenger</option>
                  <option value="Email">ส่งทาง Email</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-bold text-brand-brown">
                  หมายเหตุถึงร้านค้า (ถ้ามี)
                </label>
                <textarea
                  rows={3}
                  value={wizard.customer_note}
                  onChange={(e) => setCustomerInfo({ customer_note: e.target.value })}
                  placeholder="ระบุโทนสีที่ชอบเป็นพิเศษ หรือเวลาที่สะดวกให้แอดมินทักแจ้งแบบ..."
                  className="input-pastel"
                />
              </div>
            </div>

            {/* Bank Account / Sensitive Info Confirmation Checkbox (PART 10) */}
            {hasSensitiveSign && (
              <div className="space-y-2 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <AlertCircle className="h-4 w-4 text-amber-700" />
                  การยืนยันความถูกต้องสำหรับป้ายบัญชีธนาคาร / ช่องทางชำระเงิน:
                </p>
                <label className="flex cursor-pointer items-start gap-2.5 text-xs text-brand-brown">
                  <input
                    type="checkbox"
                    checked={wizard.sensitive_data_confirmed}
                    onChange={(e) =>
                      setCustomerInfo({ sensitive_data_confirmed: e.target.checked })
                    }
                    className="mt-0.5 h-4 w-4 rounded accent-brand-pink-dark"
                  />
                  <span>
                    ฉันได้ตรวจสอบ <strong>ชื่อบัญชี และ เลขบัญชี/พร้อมเพย์</strong> ในสรุปรายการด้านขวาเรียบร้อยแล้วว่าถูกต้องครบถ้วนทุกหลัก
                  </span>
                </label>
              </div>
            )}

            <div className="flex items-start gap-2.5 rounded-2xl bg-brand-cream p-4 text-xs text-brand-brown-soft">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-pink-dark" />
              <span>
                เมื่อกดยืนยันคำสั่งซื้อ ระบบจะตรวจสอบราคาจากฐานข้อมูลฝั่งเซิร์ฟเวอร์ บันทึก Snapshot ราคาและรายละเอียดป้ายแบบ Transaction และตั้งสถานะเริ่มต้นเป็น <strong>"รอตรวจสอบ"</strong> (ยังไม่ต้องชำระเงินออนไลน์ทันที)
              </span>
            </div>
          </div>

          {/* Final Pre-Confirmation Summary Card (PART 12) */}
          <div className="lg:col-span-5">
            <div className="card-pastel relative space-y-4 overflow-hidden p-6">
              <img
                src={SITE_DECORATIONS.mascots.bearPudding}
                alt=""
                className="pointer-events-none absolute right-4 top-3 h-14 w-14 rotate-3 object-contain opacity-95"
              />
              <h3 className="flex items-center gap-2 pr-14 text-lg font-bold text-brand-brown">
                <img src={SITE_DECORATIONS.bows.pinkBow} alt="" className="h-5 w-5 object-contain" />
                ทบทวนคำสั่งซื้อก่อนยืนยัน ({wizard.items.length} รายการ)
              </h3>

              <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                {wizard.items.map((item, idx) => {
                  const cat = signCategories.find((c) => c.id === item.sign_category_id);
                  const style = signStyles.find((s) => s.id === item.style_id);
                  const tpl = signTemplates.find((t) => t.id === item.template_id);
                  const bd = pricing.items[idx];
                  return (
                    <div
                      key={item.draft_id}
                      className="space-y-1.5 rounded-2xl border border-[#EAD9CE] bg-brand-cream p-3.5 text-xs"
                    >
                      <div className="flex justify-between font-bold text-brand-brown">
                        <span>
                          #{idx + 1} {cat?.name} ({style?.code})
                        </span>
                        <span className="text-brand-pink-dark">{formatTHB(bd.line_total)}</span>
                      </div>
                      <p className="text-brand-brown-soft">
                        เทมเพลต: {tpl?.code} — {tpl?.name}
                      </p>
                      <p className="font-medium text-emerald-700">
                        ของตกแต่งฟรี: {item.decoration_ids.length} ชิ้น (0 บาท)
                      </p>
                      <div className="space-y-0.5 border-t border-[#E6D7CD] pt-1.5">
                        {Object.entries(item.field_values).map(([k, v]) =>
                          v ? (
                            <p key={k} className="truncate text-brand-brown">
                              • <span className="text-brand-brown-soft">{k}:</span> {v}
                            </p>
                          ) : null
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5 border-t border-[#EAD9CE] pt-3 text-sm">
                <div className="flex justify-between text-xs">
                  <span className="text-brand-brown-soft">รวมราคาป้าย</span>
                  <span>{formatTHB(pricing.subtotal)}</span>
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
                    <span>ส่วนลดโปรโมชั่น</span>
                    <span>-{formatTHB(pricing.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#EAD9CE] pt-2 text-lg font-bold">
                  <span>ยอดชำระสุทธิ</span>
                  <span className="text-brand-pink-dark">{formatTHB(pricing.grand_total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="btn-primary w-full !py-4 text-base font-bold shadow-pastel"
              >
                <Sparkles className="h-5 w-5" />
                <span>
                  {isSubmittingOrder
                    ? 'กำลังบันทึกคำสั่งซื้อ...'
                    : `ยืนยันการสั่งทำป้าย (${formatTHB(pricing.grand_total)})`}
                </span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Bottom Stepper Navigation Bar */}
      <div className="card-pastel flex items-center justify-between p-4">
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={wizard.current_step === 1}
          className="btn-secondary !px-5 !py-2.5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> ย้อนกลับขั้นตอนก่อนหน้า
        </button>

        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-brown-soft">
          <img src={SITE_DECORATIONS.badges.stampSquare} alt="" className="h-4 w-4 object-contain" />
          ขั้นตอนที่ {wizard.current_step} จาก 7
          <img src={SITE_DECORATIONS.sweets.miniHeart} alt="" className="h-3.5 w-3.5 object-contain" />
        </span>

        {wizard.current_step < 7 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="btn-primary !px-6 !py-2.5 text-sm font-bold"
          >
            <span>ไปขั้นตอนถัดไป</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <span className="text-xs font-bold text-brand-pink-dark">
            กดปุ่ม "ยืนยันการสั่งทำป้าย" ด้านบนเพื่อส่งออเดอร์
          </span>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxTpl && (
        <ImageLightboxModal
          isOpen={Boolean(lightboxTpl)}
          onClose={() => setLightboxTpl(null)}
          imageUrl={lightboxTpl.preview_image_url}
          title={lightboxTpl.name}
          code={lightboxTpl.code}
          subtitle={currentCategory?.name}
          description={lightboxTpl.description}
          isSelected={activeItem.template_id === lightboxTpl.id}
          onSelect={() => selectTemplate(lightboxTpl.id, true)}
        />
      )}
    </div>
  );
};
