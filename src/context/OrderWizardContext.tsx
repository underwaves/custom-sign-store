import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { OrderRecord, OrderWizardState, WizardSignDraftItem } from '@/types/database';
import { useStore } from '@/context/StoreContext';
import { toast } from 'sonner';

const WIZARD_DRAFT_STORAGE_KEY = 'custom_sign_studio_wizard_draft_v1';

function createBlankDraftItem(defaultCategoryId = '', defaultStyleId = ''): WizardSignDraftItem {
  return {
    draft_id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sign_category_id: defaultCategoryId,
    style_id: defaultStyleId,
    template_id: '',
    decoration_ids: [],
    field_values: {},
    field_files: {},
    quantity: 1,
    item_note: '',
  };
}

const INITIAL_WIZARD_STATE: OrderWizardState = {
  current_step: 1,
  active_item_index: 0,
  items: [createBlankDraftItem()],
  promotion_code: '',
  customer_name: '',
  customer_contact: '',
  customer_email: '',
  delivery_channel: 'LINE Official',
  customer_note: '',
  sensitive_data_confirmed: false,
};

interface OrderWizardContextValue {
  wizard: OrderWizardState;
  activeItem: WizardSignDraftItem;
  setStep: (step: 1 | 2 | 3 | 4 | 5 | 6 | 7) => void;
  setActiveItemIndex: (index: number) => void;
  selectSignCategory: (categoryId: string, autoAdvance?: boolean) => void;
  selectStyle: (styleId: string, autoAdvance?: boolean) => void;
  selectTemplate: (templateId: string, autoAdvance?: boolean) => void;
  toggleDecorationSelection: (decorationId: string) => void;
  clearDecorationsForActiveItem: () => void;
  setFieldValue: (fieldKey: string, value: string) => void;
  setFieldFile: (fieldKey: string, storagePathOrUrl: string) => void;
  setItemQuantity: (qty: number) => void;
  setItemNote: (note: string) => void;
  addAnotherSignItem: (categoryId?: string) => void;
  removeSignItem: (index: number) => void;
  setPromotionCode: (code: string) => void;
  setCustomerInfo: (info: Partial<Pick<OrderWizardState, 'customer_name' | 'customer_contact' | 'customer_email' | 'delivery_channel' | 'customer_note' | 'sensitive_data_confirmed'>>) => void;
  startOrderWithTemplate: (templateId: string) => void;
  reorderFromPastOrder: (order: OrderRecord) => void;
  resetWizard: () => void;
  lastConfirmedOrder: OrderRecord | null;
  setLastConfirmedOrder: (order: OrderRecord | null) => void;
}

const OrderWizardContext = createContext<OrderWizardContextValue | undefined>(undefined);

export const OrderWizardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signTemplates, currentUser } = useStore();

  const [wizard, setWizard] = useState<OrderWizardState>(() => {
    try {
      const saved = localStorage.getItem(WIZARD_DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as OrderWizardState;
        if (Array.isArray(parsed.items) && parsed.items.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore corrupted draft
    }
    return INITIAL_WIZARD_STATE;
  });

  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<OrderRecord | null>(null);

  // Sync temporary wizard draft to Local Storage (only draft; confirmed orders go to Supabase DB)
  useEffect(() => {
    try {
      localStorage.setItem(WIZARD_DRAFT_STORAGE_KEY, JSON.stringify(wizard));
    } catch {
      // ignore storage quota errors
    }
  }, [wizard]);

  // Pre-fill customer contact fields when user logs in if still empty
  useEffect(() => {
    if (currentUser) {
      setWizard((prev) => ({
        ...prev,
        customer_name: prev.customer_name || currentUser.full_name || '',
        customer_contact: prev.customer_contact || currentUser.phone || currentUser.contact_channel || '',
        customer_email: prev.customer_email || currentUser.email || '',
      }));
    }
  }, [currentUser]);

  const activeItem: WizardSignDraftItem =
    wizard.items[wizard.active_item_index] ?? wizard.items[0] ?? createBlankDraftItem();

  const updateActiveItem = useCallback(
    (updater: (item: WizardSignDraftItem) => WizardSignDraftItem) => {
      setWizard((prev) => {
        const idx = Math.min(prev.active_item_index, prev.items.length - 1);
        const nextItems = prev.items.map((it, i) => (i === idx ? updater(it) : it));
        return { ...prev, items: nextItems };
      });
    },
    []
  );

  const setStep = useCallback((step: 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
    setWizard((prev) => ({ ...prev, current_step: step }));
  }, []);

  const setActiveItemIndex = useCallback((index: number) => {
    setWizard((prev) => ({
      ...prev,
      active_item_index: Math.max(0, Math.min(index, prev.items.length - 1)),
    }));
  }, []);

  const selectSignCategory = useCallback(
    (categoryId: string, autoAdvance = true) => {
      updateActiveItem((item) => {
        // Check if current template belongs to the new sign category
        const currentTpl = signTemplates.find((t) => t.id === item.template_id);
        const shouldClearTpl = currentTpl && currentTpl.sign_category_id !== categoryId;
        if (shouldClearTpl) {
          toast.info('เปลี่ยนประเภทป้ายแล้ว ระบบรีเซ็ตเทมเพลตเดิมเพื่อให้ตรงกับประเภทป้ายใหม่');
        }
        return {
          ...item,
          sign_category_id: categoryId,
          template_id: shouldClearTpl ? '' : item.template_id,
        };
      });
      if (autoAdvance) {
        setWizard((prev) => ({ ...prev, current_step: 2 }));
      }
    },
    [signTemplates, updateActiveItem]
  );

  // PART 8: หากลูกค้าย้อนกลับไปเปลี่ยนสไตล์ ระบบต้องแจ้งหรือจัดการการเลือกเทมเพลตเดิมอย่างเหมาะสม เพื่อป้องกันไม่ให้เลือกเทมเพลตผิดสไตล์
  const selectStyle = useCallback(
    (styleId: string, autoAdvance = true) => {
      updateActiveItem((item) => {
        const currentTpl = signTemplates.find((t) => t.id === item.template_id);
        const isMismatchedStyle = currentTpl && currentTpl.style_id !== styleId;
        if (isMismatchedStyle) {
          toast.warning(
            `คุณเปลี่ยนสไตล์ป้าย ระบบได้ยกเลิกเทมเพลตเดิม (${currentTpl.code}) เพื่อป้องกันการเลือกเทมเพลตผิดสไตล์ กรุณาเลือกเทมเพลตใหม่ในขั้นถัดไป`
          );
        }
        return {
          ...item,
          style_id: styleId,
          template_id: isMismatchedStyle ? '' : item.template_id,
        };
      });
      if (autoAdvance) {
        setWizard((prev) => ({ ...prev, current_step: 3 }));
      }
    },
    [signTemplates, updateActiveItem]
  );

  const selectTemplate = useCallback(
    (templateId: string, autoAdvance = false) => {
      const tpl = signTemplates.find((t) => t.id === templateId);
      if (!tpl) return;
      updateActiveItem((item) => ({
        ...item,
        sign_category_id: tpl.sign_category_id,
        style_id: tpl.style_id,
        template_id: tpl.id,
      }));
      if (autoAdvance) {
        setWizard((prev) => ({ ...prev, current_step: 4 }));
      }
    },
    [signTemplates, updateActiveItem]
  );

  const toggleDecorationSelection = useCallback(
    (decorationId: string) => {
      updateActiveItem((item) => {
        const exists = item.decoration_ids.includes(decorationId);
        const nextIds = exists
          ? item.decoration_ids.filter((id) => id !== decorationId)
          : [...item.decoration_ids, decorationId];
        return { ...item, decoration_ids: nextIds };
      });
    },
    [updateActiveItem]
  );

  const clearDecorationsForActiveItem = useCallback(() => {
    updateActiveItem((item) => ({ ...item, decoration_ids: [] }));
  }, [updateActiveItem]);

  const setFieldValue = useCallback(
    (fieldKey: string, value: string) => {
      updateActiveItem((item) => ({
        ...item,
        field_values: { ...item.field_values, [fieldKey]: value },
      }));
    },
    [updateActiveItem]
  );

  const setFieldFile = useCallback(
    (fieldKey: string, storagePathOrUrl: string) => {
      updateActiveItem((item) => ({
        ...item,
        field_files: { ...item.field_files, [fieldKey]: storagePathOrUrl },
      }));
    },
    [updateActiveItem]
  );

  const setItemQuantity = useCallback(
    (qty: number) => {
      updateActiveItem((item) => ({
        ...item,
        quantity: Math.max(1, Math.min(99, Math.round(qty || 1))),
      }));
    },
    [updateActiveItem]
  );

  const setItemNote = useCallback(
    (note: string) => {
      updateActiveItem((item) => ({ ...item, item_note: note }));
    },
    [updateActiveItem]
  );

  const addAnotherSignItem = useCallback((categoryId = '') => {
    const newItem = createBlankDraftItem(categoryId);
    setWizard((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
      active_item_index: prev.items.length,
      current_step: categoryId ? 2 : 1,
    }));
    toast.success('เพิ่มรายการป้ายใบใหม่ในออเดอร์นี้แล้ว');
  }, []);

  const removeSignItem = useCallback((index: number) => {
    setWizard((prev) => {
      if (prev.items.length <= 1) {
        return {
          ...prev,
          items: [createBlankDraftItem()],
          active_item_index: 0,
          current_step: 1,
        };
      }
      const nextItems = prev.items.filter((_, idx) => idx !== index);
      return {
        ...prev,
        items: nextItems,
        active_item_index: Math.max(0, Math.min(prev.active_item_index, nextItems.length - 1)),
      };
    });
    toast.info('ลบรายการป้ายออกจากออเดอร์แล้ว');
  }, []);

  const setPromotionCode = useCallback((code: string) => {
    setWizard((prev) => ({ ...prev, promotion_code: code }));
  }, []);

  const setCustomerInfo = useCallback(
    (
      info: Partial<
        Pick<
          OrderWizardState,
          | 'customer_name'
          | 'customer_contact'
          | 'customer_email'
          | 'delivery_channel'
          | 'customer_note'
          | 'sensitive_data_confirmed'
        >
      >
    ) => {
      setWizard((prev) => ({ ...prev, ...info }));
    },
    []
  );

  const startOrderWithTemplate = useCallback(
    (templateId: string) => {
      const tpl = signTemplates.find((t) => t.id === templateId);
      if (!tpl) return;
      updateActiveItem((item) => ({
        ...item,
        sign_category_id: tpl.sign_category_id,
        style_id: tpl.style_id,
        template_id: tpl.id,
      }));
      setWizard((prev) => ({ ...prev, current_step: 4 }));
    },
    [signTemplates, updateActiveItem]
  );

  const reorderFromPastOrder = useCallback((order: OrderRecord) => {
    if (!order.items.length) return;
    const restoredItems: WizardSignDraftItem[] = order.items.map((oi) => {
      const fieldVals: Record<string, string> = {};
      for (const f of oi.fields) {
        fieldVals[f.snapshot_field_key] = f.field_value;
      }
      return {
        draft_id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sign_category_id: oi.sign_category_id ?? '',
        style_id: oi.style_id ?? '',
        template_id: oi.template_id ?? '',
        decoration_ids: oi.decorations
          .map((d) => d.decoration_id)
          .filter((x): x is string => Boolean(x)),
        field_values: fieldVals,
        field_files: {},
        quantity: oi.quantity,
        item_note: oi.item_note,
      };
    });

    setWizard((prev) => ({
      ...prev,
      current_step: 6,
      active_item_index: 0,
      items: restoredItems,
      customer_name: order.customer_name || prev.customer_name,
      customer_contact: order.customer_contact || prev.customer_contact,
      customer_email: order.customer_email || prev.customer_email,
      delivery_channel: order.delivery_channel || prev.delivery_channel,
      sensitive_data_confirmed: false,
    }));
    toast.success(`ดึงรายการจากออเดอร์ ${order.order_number} มาตั้งต้นใหม่เรียบร้อยแล้ว`);
  }, []);

  const resetWizard = useCallback(() => {
    const fresh: OrderWizardState = {
      ...INITIAL_WIZARD_STATE,
      items: [createBlankDraftItem()],
      customer_name: currentUser?.full_name ?? '',
      customer_contact: currentUser?.phone ?? '',
      customer_email: currentUser?.email ?? '',
    };
    setWizard(fresh);
    localStorage.removeItem(WIZARD_DRAFT_STORAGE_KEY);
  }, [currentUser]);

  return (
    <OrderWizardContext.Provider
      value={{
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
        startOrderWithTemplate,
        reorderFromPastOrder,
        resetWizard,
        lastConfirmedOrder,
        setLastConfirmedOrder,
      }}
    >
      {children}
    </OrderWizardContext.Provider>
  );
};

export function useOrderWizard(): OrderWizardContextValue {
  const ctx = useContext(OrderWizardContext);
  if (!ctx) throw new Error('useOrderWizard must be used inside OrderWizardProvider');
  return ctx;
}
