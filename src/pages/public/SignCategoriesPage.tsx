import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Layers, Sparkles, CheckCircle2, PlusCircle } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useOrderWizard } from '@/context/OrderWizardContext';
import { formatTHB } from '@/utils/pricing';
import { SectionHeaderBannerDecor } from '@/components/common/CardFrameDecoration';
import { SITE_DECORATIONS, CATEGORY_DECOR_PRESETS } from '@/data/siteDecorations';

export const SignCategoriesPage: React.FC = () => {
  const { categoryGroups, signCategories, signTemplates } = useStore();
  const { wizard, activeItem, selectSignCategory, addAnotherSignItem } = useOrderWizard();
  const navigate = useNavigate();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const activeGroups = useMemo(
    () => categoryGroups.filter((g) => g.is_active).sort((a, b) => a.sort_order - b.sort_order),
    [categoryGroups]
  );

  const filteredCategories = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return signCategories
      .filter((c) => c.is_active)
      .filter((c) => (selectedGroupId === 'ALL' ? true : c.group_id === selectedGroupId))
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.short_description.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.group_name.toLowerCase().includes(q)
      )
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [signCategories, selectedGroupId, searchTerm]);

  const handleSelectSignType = (categoryId: string) => {
    selectSignCategory(categoryId, true);
    navigate('/order-wizard');
  };

  const handleAddAsNewItemInOrder = (categoryId: string) => {
    addAnotherSignItem(categoryId);
    navigate('/order-wizard');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10">
      {/* Page Header with purposeful banner decorations */}
      <div className="card-pastel relative overflow-hidden bg-gradient-to-r from-brand-pink-light/60 via-white to-brand-cream p-6 sm:p-8">
        <SectionHeaderBannerDecor
          leftMascot={SITE_DECORATIONS.mascots.mascotDonut}
          rightSweet={SITE_DECORATIONS.sweets.pancakeTower}
          topBow={SITE_DECORATIONS.bows.pinkBow}
        />

        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="badge-pastel bg-white text-brand-pink-dark shadow-sm">
              <Layers className="h-3.5 w-3.5" /> หมวดหมู่และประเภทป้ายทั้งหมด
              <img src={SITE_DECORATIONS.bows.miniBow} alt="" className="h-4 w-4 object-contain" />
            </span>
            <h1 className="mt-2 text-2xl font-bold text-brand-brown sm:text-3xl">
              เลือกประเภทป้ายที่ต้องการสั่งทำ ({filteredCategories.length} ประเภท)
            </h1>
            <p className="mt-1 text-sm text-brand-brown-soft">
              คุณสามารถเลือกสั่งป้ายเดียว หรือกด <strong>"+ เพิ่มป้ายใบที่ {wizard.items.length + 1}"</strong> เพื่อสั่งหลายประเภทในออเดอร์เดียวกันได้
            </p>
          </div>
          <div className="relative flex items-center gap-3 rounded-2xl border border-[#EAD9CE] bg-white/95 p-4 pr-14 text-xs shadow-2xs">
            <img
              src={SITE_DECORATIONS.mascots.rabbitCute}
              alt=""
              className="pointer-events-none absolute right-2.5 top-2 h-11 w-11 object-contain"
            />
            <div>
              <p className="font-bold text-brand-brown">
                รายการป้ายในออเดอร์ปัจจุบัน: {wizard.items.length} รายการ
              </p>
              <p className="mt-0.5 font-medium text-emerald-700">
                ✨ ของตกแต่งพาสเทลทุกชิ้น ฟรี 0 บาท
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="relative z-10 mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedGroupId('ALL')}
              className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
                selectedGroupId === 'ALL'
                  ? 'bg-brand-pink-dark text-white shadow-sm'
                  : 'border border-[#EAD9CE] bg-white text-brand-brown hover:bg-brand-pink-light/40'
              }`}
            >
              ทั้งหมด ({signCategories.filter((c) => c.is_active).length})
            </button>
            {activeGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroupId(group.id)}
                className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
                  selectedGroupId === group.id
                    ? 'bg-brand-pink-dark text-white shadow-sm'
                    : 'border border-[#EAD9CE] bg-white text-brand-brown hover:bg-brand-pink-light/40'
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อประเภทป้าย เช่น ป้ายบัญชี..."
              className="input-pastel !py-2.5 pl-10 text-sm"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-brand-brown-soft" />
          </div>
        </div>
      </div>

      {/* Grid Cards */}
      {filteredCategories.length === 0 ? (
        <div className="card-pastel relative overflow-hidden p-12 text-center">
          <img
            src={SITE_DECORATIONS.mascots.mascotHeadBerry}
            alt=""
            className="mx-auto mb-3 h-16 w-16 object-contain"
          />
          <p className="text-lg font-bold text-brand-brown">ไม่พบประเภทป้ายที่ตรงกับคำค้นหา</p>
          <p className="mt-1 text-sm text-brand-brown-soft">
            ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่ "ทั้งหมด"
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedGroupId('ALL');
              setSearchTerm('');
            }}
            className="btn-secondary mt-4 text-xs"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((cat, idx) => {
            const isSelectedInActiveDraft = activeItem.sign_category_id === cat.id;
            const tplCount = signTemplates.filter(
              (t) => t.sign_category_id === cat.id && t.is_active && t.status === 'published'
            ).length;
            const preset = CATEGORY_DECOR_PRESETS[idx % CATEGORY_DECOR_PRESETS.length];

            return (
              <div
                key={cat.id}
                className={`card-pastel card-pastel-hover group relative flex flex-col overflow-hidden ${
                  isSelectedInActiveDraft ? 'border-brand-pink-dark ring-2 ring-brand-pink-dark' : ''
                }`}
              >
                <div className="relative aspect-[16/11] bg-brand-cream p-3">
                  <img
                    src={cat.preview_image_url}
                    alt={cat.name}
                    className="h-full w-full rounded-2xl object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                  <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-brown shadow-sm">
                    <img src={preset.pin} alt="" className="h-3.5 w-3.5 object-contain" />
                    เริ่มต้น {formatTHB(cat.base_price)}
                  </span>
                  {isSelectedInActiveDraft && (
                    <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" /> กำลังเลือกอยู่
                    </span>
                  )}
                  <img
                    src={preset.primary}
                    alt=""
                    className="pointer-events-none absolute bottom-4 right-4 h-12 w-12 rotate-3 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                <div className="relative flex flex-1 flex-col justify-between p-5">
                  <img
                    src={preset.secondary}
                    alt=""
                    className="pointer-events-none absolute right-4 top-4 h-5 w-5 object-contain opacity-80"
                  />
                  <div className="pr-6">
                    <div className="flex items-center justify-between text-xs text-brand-brown-soft">
                      <span className="inline-flex items-center gap-1 font-medium">
                        {cat.group_name}
                        <span className="text-[11px] font-semibold text-brand-pink-dark">
                          • {preset.themeLabel}
                        </span>
                      </span>
                      <span>มี {tplCount} เทมเพลต</span>
                    </div>
                    <h2 className="mt-1.5 text-lg font-bold text-brand-brown">{cat.name}</h2>
                    <p className="mt-1 text-sm text-brand-brown-soft">{cat.short_description}</p>
                    <p className="mt-2 line-clamp-2 text-xs text-brand-brown-soft/80">
                      {cat.description}
                    </p>
                  </div>

                  <div className="mt-5 space-y-2 border-t border-[#F2E6DF] pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-[11px] text-brand-brown-soft">ราคาฐานเริ่มต้น</span>
                        <span className="text-lg font-bold text-brand-pink-dark">
                          {formatTHB(cat.base_price)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectSignType(cat.id)}
                        className="btn-primary !px-4 !py-2.5 text-xs font-bold"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{isSelectedInActiveDraft ? 'ไปขั้นตอนเลือกสไตล์ต่อ' : 'เลือกป้ายนี้'}</span>
                      </button>
                    </div>

                    {activeItem.sign_category_id && activeItem.sign_category_id !== cat.id && (
                      <button
                        type="button"
                        onClick={() => handleAddAsNewItemInOrder(cat.id)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-pink-dark bg-brand-pink-light/30 py-2 text-xs font-semibold text-brand-brown hover:bg-brand-pink-light"
                      >
                        <PlusCircle className="h-3.5 w-3.5 text-brand-pink-dark" />
                        <span>+ เพิ่ม "{cat.name}" เป็นป้ายอีกใบในออเดอร์เดียวกัน</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
