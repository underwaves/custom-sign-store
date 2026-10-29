import {
  Promotion,
  SignCategory,
  SignStyle,
  SignTemplate,
  WizardSignDraftItem,
} from '@/types/database';

export interface ItemPriceBreakdown {
  draft_id: string;
  sign_category_name: string;
  style_name: string;
  template_code: string;
  template_name: string;
  base_price: number;
  style_price: number;
  addon_price: number;
  decorations_count: number;
  decorations_price: 0; // Strictly 0 THB always per PART 9 & PART 11
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface OrderPriceCalculationResult {
  items: ItemPriceBreakdown[];
  subtotal: number;
  discount_amount: number;
  applied_promotion: Promotion | null;
  promotion_message: string | null;
  service_fee: number;
  grand_total: number;
}

/**
 * PART 11: ระบบคำนวณราคา
 * ราคาต่อป้าย = ราคาฐานของประเภทป้าย + ราคาเพิ่มของสไตล์ + ตัวเลือกเสริมที่มีราคา
 * ยอดรวม = ผลรวมราคาของทุกรายการ - ส่วนลด + ค่าบริการที่กำหนดไว้จริง
 * ของตกแต่งทุกชิ้นมีราคา 0 บาท และไม่มีผลต่อยอดรวม
 */
export function calculateOrderPricing(params: {
  draftItems: WizardSignDraftItem[];
  categories: SignCategory[];
  styles: SignStyle[];
  templates: SignTemplate[];
  promotions: Promotion[];
  promotionCode?: string;
  serviceFee?: number;
}): OrderPriceCalculationResult {
  const {
    draftItems,
    categories,
    styles,
    templates,
    promotions,
    promotionCode = '',
    serviceFee = 0,
  } = params;

  const breakdowns: ItemPriceBreakdown[] = draftItems.map((draft) => {
    const cat = categories.find((c) => c.id === draft.sign_category_id);
    const style = styles.find((s) => s.id === draft.style_id);
    const tpl = templates.find((t) => t.id === draft.template_id);

    const basePrice =
      tpl?.base_price_override !== null && tpl?.base_price_override !== undefined
        ? Number(tpl.base_price_override)
        : Number(cat?.base_price ?? 0);

    const stylePrice = Number(style?.price_modifier ?? 0);
    const addonPrice = 0;
    const decorationsPrice = 0 as const; // Free 0 THB regardless of how many are selected!

    const unitPrice = Math.max(0, basePrice + stylePrice + addonPrice + decorationsPrice);
    const qty = Math.max(1, Number(draft.quantity || 1));
    const lineTotal = unitPrice * qty;

    return {
      draft_id: draft.draft_id,
      sign_category_name: cat?.name ?? 'ยังไม่เลือกประเภทป้าย',
      style_name: style?.name ?? 'ยังไม่เลือกสไตล์',
      template_code: tpl?.code ?? '-',
      template_name: tpl?.name ?? 'ยังไม่เลือกเทมเพลต',
      base_price: basePrice,
      style_price: stylePrice,
      addon_price: addonPrice,
      decorations_count: draft.decoration_ids.length,
      decorations_price: 0,
      unit_price: unitPrice,
      quantity: qty,
      line_total: lineTotal,
    };
  });

  const subtotal = breakdowns.reduce((acc, item) => acc + item.line_total, 0);

  let discountAmount = 0;
  let appliedPromotion: Promotion | null = null;
  let promotionMessage: string | null = null;

  const cleanCode = promotionCode.trim().toUpperCase();
  if (cleanCode) {
    const promo = promotions.find(
      (p) => p.is_active && p.code.toUpperCase() === cleanCode
    );
    if (!promo) {
      promotionMessage = 'ไม่พบรหัสส่วนลดนี้ หรือโปรโมชั่นหมดอายุแล้ว';
    } else if (subtotal < promo.min_order_amount) {
      promotionMessage = `รหัส ${promo.code} ใช้ได้เมื่อมียอดสั่งซื้อขั้นต่ำ ${promo.min_order_amount.toLocaleString()} บาท`;
    } else {
      appliedPromotion = promo;
      if (promo.discount_type === 'percentage') {
        discountAmount = Math.round(((subtotal * promo.discount_value) / 100) * 100) / 100;
        if (promo.max_discount_amount !== null && promo.max_discount_amount !== undefined) {
          discountAmount = Math.min(discountAmount, promo.max_discount_amount);
        }
      } else {
        discountAmount = promo.discount_value;
      }
      discountAmount = Math.min(discountAmount, subtotal);
      promotionMessage = `ใช้โค้ด ${promo.code} (${promo.title}) สำเร็จ`;
    }
  }

  const normalizedServiceFee = Math.max(0, Number(serviceFee || 0));
  const grandTotal = Math.max(0, subtotal - discountAmount + normalizedServiceFee);

  return {
    items: breakdowns,
    subtotal,
    discount_amount: discountAmount,
    applied_promotion: appliedPromotion,
    promotion_message: promotionMessage,
    service_fee: normalizedServiceFee,
    grand_total: grandTotal,
  };
}

export function formatTHB(amount: number): string {
  return `${Number(amount || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} บาท`;
}

export const formatPrice = formatTHB;

