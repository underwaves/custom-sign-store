import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Heart, Eye, Sparkles, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useOrderWizard } from '@/context/OrderWizardContext';
import { formatTHB } from '@/utils/pricing';
import { ImageLightboxModal } from '@/components/common/ImageLightboxModal';
import { SectionHeaderBannerDecor } from '@/components/common/CardFrameDecoration';
import { SignTemplate } from '@/types/database';
import { SITE_DECORATIONS, TEMPLATE_CARD_ACCENTS } from '@/data/siteDecorations';

const PAGE_SIZE = 8;

export const TemplateGalleryPage: React.FC = () => {
  const { signCategories, signStyles, signTemplates, favorites, toggleFavorite } = useStore();
  const { activeItem, startOrderWithTemplate } = useOrderWizard();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [categoryFilter, setCategoryFilter] = useState<string>(
    searchParams.get('category') || 'ALL'
  );
  const [styleFilter, setStyleFilter] = useState<string>(searchParams.get('style') || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  const [page, setPage] = useState<number>(1);
  const [lightboxTpl, setLightboxTpl] = useState<SignTemplate | null>(null);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return signTemplates
      .filter((t) => t.is_active && t.status === 'published')
      .filter((t) => (categoryFilter === 'ALL' ? true : t.sign_category_id === categoryFilter))
      .filter((t) => (styleFilter === 'ALL' ? true : t.style_id === styleFilter))
      .filter((t) => {
        if (!q) return true;
        const cat = signCategories.find((c) => c.id === t.sign_category_id);
        return (
          t.code.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (cat?.name.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [signTemplates, categoryFilter, styleFilter, searchQuery, signCategories]);

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleUseTemplate = (tplId: string) => {
    startOrderWithTemplate(tplId);
    navigate('/order-wizard');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10">
      {/* Header & Filters with purposeful stationery & dessert accents */}
      <div className="card-pastel relative space-y-5 overflow-hidden p-6 sm:p-8">
        <SectionHeaderBannerDecor
          leftMascot={SITE_DECORATIONS.mascots.bearPudding}
          rightSweet={SITE_DECORATIONS.sweets.cherryCreamTart}
          topBow={SITE_DECORATIONS.bows.pinkBow}
        />

        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="badge-pastel bg-brand-pink-light text-brand-pink-dark">
              <Sparkles className="h-3.5 w-3.5" /> Template Gallery (PART 8)
              <img src={SITE_DECORATIONS.bows.miniBow} alt="" className="h-4 w-4 object-contain" />
            </span>
            <h1 className="mt-2 text-2xl font-bold text-brand-brown sm:text-3xl">
              แกลเลอรีเทมเพลตป้ายสำเร็จรูป ({filteredTemplates.length} แบบ)
            </h1>
            <p className="mt-1 text-sm text-brand-brown-soft">
              คลิกปุ่มแว่นขยายเพื่อดูภาพตัวอย่างขนาดใหญ่ หรือคลิกเลือกเทมเพลตเพื่อนำไปปรับข้อความและเลือกของตกแต่งฟรี
            </p>
          </div>

          <div className="relative flex items-center gap-2.5 rounded-2xl border border-[#EAD9CE] bg-brand-cream/90 px-4 py-2.5 text-xs">
            <img
              src={SITE_DECORATIONS.mascots.rabbitCute}
              alt=""
              className="h-9 w-9 shrink-0 object-contain"
            />
            <div>
              <p className="font-bold text-brand-brown">ทุกเทมเพลตปรับสี &amp; ข้อความได้</p>
              <p className="font-semibold text-emerald-700">+ เลือกของตกแต่งพาสเทลฟรี 0฿</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-brand-brown">
              กรองตามประเภทป้าย
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="input-pastel !py-2.5 text-sm"
            >
              <option value="ALL">ทุกประเภทป้าย ({signCategories.filter((c) => c.is_active).length})</option>
              {signCategories
                .filter((c) => c.is_active)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} (เริ่มต้น {formatTHB(cat.base_price)})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-brand-brown">
              กรองตามสไตล์ (Minimal / Decorative)
            </label>
            <select
              value={styleFilter}
              onChange={(e) => {
                setStyleFilter(e.target.value);
                setPage(1);
              }}
              className="input-pastel !py-2.5 text-sm"
            >
              <option value="ALL">ทุกสไตล์ (Minimal &amp; Decorative)</option>
              {signStyles
                .filter((s) => s.is_active)
                .map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} (+{formatTHB(st.price_modifier)})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-brand-brown">
              ค้นหารหัสเทมเพลต (เช่น MIN-001, DEC-001) หรือชื่อ
            </label>
            <div className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="พิมพ์รหัส MIN-001 หรือคำค้น..."
                className="input-pastel !py-2.5 pl-10 text-sm"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-brand-brown-soft" />
            </div>
          </div>
        </div>
      </div>

      {/* Template Grid */}
      {paginatedTemplates.length === 0 ? (
        <div className="card-pastel relative overflow-hidden p-12 text-center">
          <img
            src={SITE_DECORATIONS.mascots.mascotHeadBerry}
            alt=""
            className="mx-auto mb-3 h-16 w-16 object-contain"
          />
          <p className="text-lg font-bold text-brand-brown">ไม่พบเทมเพลตที่ตรงกับตัวกรอง</p>
          <p className="mt-1 text-sm text-brand-brown-soft">
            ลองเลือก "ทุกประเภทป้าย" และ "ทุกสไตล์" เพื่อดูเทมเพลตทั้งหมด
          </p>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('ALL');
              setStyleFilter('ALL');
              setSearchQuery('');
              setPage(1);
            }}
            className="btn-secondary mt-4 text-xs"
          >
            แสดงเทมเพลตทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {paginatedTemplates.map((tpl, idx) => {
            const cat = signCategories.find((c) => c.id === tpl.sign_category_id);
            const style = signStyles.find((s) => s.id === tpl.style_id);
            const basePrice = tpl.base_price_override ?? cat?.base_price ?? 59;
            const totalPrice = basePrice + (style?.price_modifier ?? 0);
            const isSelected = activeItem.template_id === tpl.id;
            const isFav = favorites.includes(tpl.id);
            const accent = TEMPLATE_CARD_ACCENTS[idx % TEMPLATE_CARD_ACCENTS.length];

            return (
              <div
                key={tpl.id}
                className={`card-pastel card-pastel-hover group relative flex flex-col overflow-hidden ${
                  isSelected ? 'border-emerald-600 ring-2 ring-emerald-600' : ''
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
                    <span className="absolute bottom-5 left-5 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                    </span>
                  )}
                  <div className="absolute right-5 top-5 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => void toggleFavorite(tpl.id)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition ${
                        isFav ? 'bg-brand-pink-dark text-white' : 'bg-white/95 text-brand-brown hover:bg-brand-pink-light'
                      }`}
                      title="บันทึกรายการโปรด"
                    >
                      <Heart className="h-4 w-4" fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightboxTpl(tpl)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-brand-brown shadow-sm transition hover:bg-brand-pink-light"
                      title="ดูภาพขนาดใหญ่"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Purposeful sweet sticker accent in the corner of the template frame */}
                  <img
                    src={accent.badge}
                    alt=""
                    className="pointer-events-none absolute bottom-4 right-4 h-9 w-9 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                <div className="relative flex flex-1 flex-col justify-between p-4">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-brand-brown-soft">{cat?.name}</span>
                      <span className="rounded-full bg-brand-pink-light px-2 py-0.5 text-[11px] font-bold text-brand-pink-dark">
                        {style?.code}
                      </span>
                    </div>
                    <Link
                      to={`/templates/${tpl.code}`}
                      className="mt-1.5 block text-base font-bold text-brand-brown hover:text-brand-pink-dark"
                    >
                      {tpl.name}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs text-brand-brown-soft">
                      {tpl.description}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-[#F2E6DF] pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-brand-brown-soft">
                        <img src={SITE_DECORATIONS.sweets.miniHeart} alt="" className="h-3 w-3 object-contain" />
                        ราคาตามสไตล์:
                      </span>
                      <span className="text-sm font-bold text-brand-pink-dark">
                        {formatTHB(totalPrice)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setLightboxTpl(tpl)}
                        className="btn-secondary flex-1 !px-3 !py-2 text-xs"
                      >
                        ดูภาพใหญ่
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUseTemplate(tpl.id)}
                        className={`flex-1 rounded-2xl px-3 py-2 text-xs font-bold text-white transition ${
                          isSelected ? 'bg-emerald-600' : 'bg-brand-pink-dark hover:opacity-95'
                        }`}
                      >
                        {isSelected ? 'เลือกแล้ว ✓' : 'เลือกใช้'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="btn-secondary !px-4 !py-2 text-xs"
          >
            ← หน้าก่อนหน้า
          </button>
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pNum = idx + 1;
            return (
              <button
                key={pNum}
                type="button"
                onClick={() => setPage(pNum)}
                className={`h-9 w-9 rounded-xl text-xs font-bold transition ${
                  currentPage === pNum
                    ? 'bg-brand-pink-dark text-white'
                    : 'border border-[#EAD9CE] bg-white text-brand-brown'
                }`}
              >
                {pNum}
              </button>
            );
          })}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="btn-secondary !px-4 !py-2 text-xs"
          >
            หน้าถัดไป →
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxTpl && (
        <ImageLightboxModal
          isOpen={Boolean(lightboxTpl)}
          onClose={() => setLightboxTpl(null)}
          imageUrl={lightboxTpl.preview_image_url}
          title={lightboxTpl.name}
          code={lightboxTpl.code}
          subtitle={
            signCategories.find((c) => c.id === lightboxTpl.sign_category_id)?.name
          }
          description={lightboxTpl.description}
          priceLabel={
            (lightboxTpl.base_price_override ??
              signCategories.find((c) => c.id === lightboxTpl.sign_category_id)?.base_price ??
              59) +
            (signStyles.find((s) => s.id === lightboxTpl.style_id)?.price_modifier ?? 0)
          }
          isSelected={activeItem.template_id === lightboxTpl.id}
          onSelect={() => handleUseTemplate(lightboxTpl.id)}
        />
      )}
    </div>
  );
};
