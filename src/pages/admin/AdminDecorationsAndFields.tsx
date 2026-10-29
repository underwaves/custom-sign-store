import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  FileText,
  FolderTree,
  Gift,
  Palette,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/context/StoreContext';
import { uploadFileToBucket } from '@/lib/supabase';
import {
  DecorationCategory,
  DecorationColor,
  DecorationItem,
  DynamicFieldType,
  ProductField,
} from '@/types/database';

// ============================================================================
// #7 Manage Decoration Colors (/admin/decoration-colors)
// ============================================================================
export const AdminManageDecorationColorsPage: React.FC = () => {
  const { decorationColors, decorations, upsertDecorationColor, deleteDecorationColor } = useStore();
  const [editingColor, setEditingColor] = useState<Partial<DecorationColor> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setEditingColor({
      name: '',
      slug: '',
      hex_code: '#F9A8D4',
      sort_order: decorationColors.length + 1,
      is_active: true,
      is_demo: false,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColor?.name?.trim()) {
      toast.error('กรุณากรอกชื่อโทนสีของตกแต่ง');
      return;
    }
    const slug =
      editingColor.slug?.trim() ||
      editingColor.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9ก-๙]+/g, '-');

    setIsSaving(true);
    try {
      await upsertDecorationColor({
        ...editingColor,
        name: editingColor.name.trim(),
        slug,
        hex_code: editingColor.hex_code || '#F9A8D4',
      });
      toast.success('บันทึกโทนสีของตกแต่งเรียบร้อยแล้ว');
      setEditingColor(null);
    } catch (err: any) {
      toast.error(err?.message || 'บันทึกโทนสีไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (color: DecorationColor) => {
    const count = decorations.filter((d) => d.color_id === color.id).length;
    if (
      !window.confirm(
        `ยืนยันการลบโทนสี "${color.name}"? ${
          count > 0 ? `(มีของตกแต่งที่ใช้สีนี้อยู่ ${count} ชิ้น)` : ''
        }`
      )
    ) {
      return;
    }
    try {
      await deleteDecorationColor(color.id);
      toast.success(`ลบโทนสี "${color.name}" เรียบร้อยแล้ว`);
    } catch (err: any) {
      toast.error(err?.message || 'ลบโทนสีไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-pink-100 shadow-pastel">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold mb-2">
            <Palette className="w-3.5 h-3.5" />
            Manage Decoration Colors (Part 9)
          </span>
          <h1 className="text-2xl font-bold text-stone-800">
            จัดการหมวดหมู่สีของตกแต่ง ({decorationColors.length} โทนสี)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            เพิ่ม ลบ แก้ไขโทนสีสำหรับกรองของตกแต่งฟรี (เช่น ชมพู, ฟ้า, เหลือง, เขียว, ม่วง, พาสเทล ฯลฯ)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          เพิ่มโทนสีใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...decorationColors]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((color) => {
            const count = decorations.filter((d) => d.color_id === color.id).length;
            return (
              <div
                key={color.id}
                className="bg-white rounded-3xl border border-pink-100 p-5 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl border-2 border-white shadow-md shrink-0"
                    style={{ backgroundColor: color.hex_code }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-800">{color.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          color.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {color.is_active ? 'เปิดใช้งาน' : 'ซ่อน'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 font-mono">
                      {color.hex_code} • slug: {color.slug}
                    </p>
                    <p className="text-xs text-pink-600 font-medium mt-0.5">
                      ของตกแต่งในสีนี้ {count} ชิ้น
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditingColor(color)}
                    className="p-2 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 transition"
                    title="แก้ไข"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(color)}
                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                    title="ลบ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {editingColor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-pink-100 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-lg text-stone-800">
                {editingColor.id ? 'แก้ไขโทนสีของตกแต่ง' : 'เพิ่มโทนสีของตกแต่งใหม่'}
              </h3>
              <button
                onClick={() => setEditingColor(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ชื่อโทนสี *
                </label>
                <input
                  type="text"
                  required
                  value={editingColor.name || ''}
                  onChange={(e) => setEditingColor({ ...editingColor, name: e.target.value })}
                  placeholder="เช่น โทนสีชมพูพาสเทล"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    รหัสสี HEX *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingColor.hex_code || '#F9A8D4'}
                      onChange={(e) =>
                        setEditingColor({ ...editingColor, hex_code: e.target.value })
                      }
                      className="w-10 h-10 rounded-xl border border-stone-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingColor.hex_code || '#F9A8D4'}
                      onChange={(e) =>
                        setEditingColor({ ...editingColor, hex_code: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ลำดับแสดงผล
                  </label>
                  <input
                    type="number"
                    value={editingColor.sort_order ?? 1}
                    onChange={(e) =>
                      setEditingColor({ ...editingColor, sort_order: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Slug (ภาษาอังกฤษ)
                </label>
                <input
                  type="text"
                  value={editingColor.slug || ''}
                  onChange={(e) => setEditingColor({ ...editingColor, slug: e.target.value })}
                  placeholder="pink-pastel"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm font-mono"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingColor.is_active ?? true}
                  onChange={(e) =>
                    setEditingColor({ ...editingColor, is_active: e.target.checked })
                  }
                  className="rounded text-pink-500"
                />
                เปิดแสดงผลโทนสีนี้
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingColor(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกโทนสี'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// #8 Manage Decoration Categories (/admin/decoration-categories)
// ============================================================================
export const AdminManageDecorationCategoriesPage: React.FC = () => {
  const {
    decorationCategories,
    decorationColors,
    decorations,
    upsertDecorationCategory,
    deleteDecorationCategory,
  } = useStore();
  const [editingCat, setEditingCat] = useState<Partial<DecorationCategory> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const rootCategories = useMemo(
    () =>
      [...decorationCategories]
        .filter((c) => !c.parent_id)
        .sort((a, b) => a.sort_order - b.sort_order),
    [decorationCategories]
  );

  const openCreate = (parentId: string | null = null) => {
    setEditingCat({
      name: '',
      slug: '',
      description: '',
      parent_id: parentId,
      default_color_id: null,
      icon_name: 'Sparkles',
      sort_order: decorationCategories.length + 1,
      is_active: true,
      is_demo: false,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat?.name?.trim()) {
      toast.error('กรุณากรอกชื่อหมวดหมู่ย่อยของตกแต่ง');
      return;
    }
    const slug =
      editingCat.slug?.trim() ||
      editingCat.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9ก-๙]+/g, '-');

    setIsSaving(true);
    try {
      await upsertDecorationCategory({
        ...editingCat,
        name: editingCat.name.trim(),
        slug,
        parent_id: editingCat.parent_id || null,
        default_color_id: editingCat.default_color_id || null,
      });
      toast.success('บันทึกหมวดหมู่ย่อยของตกแต่งเรียบร้อยแล้ว');
      setEditingCat(null);
    } catch (err: any) {
      toast.error(err?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat: DecorationCategory) => {
    if (!window.confirm(`ยืนยันการลบหมวดหมู่ของตกแต่ง "${cat.name}"?`)) return;
    try {
      await deleteDecorationCategory(cat.id);
      toast.success(`ลบหมวดหมู่ "${cat.name}" เรียบร้อยแล้ว`);
    } catch (err: any) {
      toast.error(err?.message || 'ลบไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-pink-100 shadow-pastel">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold mb-2">
            <FolderTree className="w-3.5 h-3.5" />
            Manage Decoration Subcategories (Part 9)
          </span>
          <h1 className="text-2xl font-bold text-stone-800">
            จัดการหมวดหมู่ย่อยของตกแต่ง ({decorationCategories.length} หมวดหมู่)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            รองรับหมวดหมู่หลักและหมวดหมู่ย่อยหลายระดับ (Hierarchical Subcategories) เช่น โบว์, ดอกไม้, หัวใจ, ดาว, มาสคอต, ไอคอนร้านค้า
          </p>
        </div>
        <button
          onClick={() => openCreate(null)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          เพิ่มหมวดหมู่ของตกแต่ง
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rootCategories.map((root) => {
          const children = decorationCategories
            .filter((c) => c.parent_id === root.id)
            .sort((a, b) => a.sort_order - b.sort_order);
          const itemCount = decorations.filter((d) => d.category_id === root.id).length;

          return (
            <div
              key={root.id}
              className="bg-white rounded-3xl border border-pink-100 p-5 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-800 text-base">{root.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 font-semibold">
                      {itemCount} ชิ้น
                    </span>
                    {!root.is_active && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                        ซ่อน
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-1">{root.description}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openCreate(root.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-pink-50 text-stone-700 hover:text-pink-600 text-xs font-semibold transition"
                    title="เพิ่มหมวดหมู่ย่อยภายใต้หมวดนี้"
                  >
                    + หมวดย่อย
                  </button>
                  <button
                    onClick={() => setEditingCat(root)}
                    className="p-2 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(root)}
                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {children.length > 0 && (
                <div className="pl-4 border-l-2 border-pink-100 space-y-2">
                  <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                    หมวดหมู่ย่อยระดับที่ 2 ({children.length})
                  </div>
                  {children.map((child) => {
                    const childCount = decorations.filter((d) => d.category_id === child.id).length;
                    return (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 border border-stone-100 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-stone-700">↳ {child.name}</span>
                          <span className="text-stone-400 ml-2">({childCount} ชิ้น)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingCat(child)}
                            className="p-1.5 rounded-lg hover:bg-white text-pink-600"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(child)}
                            className="p-1.5 rounded-lg hover:bg-white text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingCat && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-pink-100 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-lg text-stone-800">
                {editingCat.id ? 'แก้ไขหมวดหมู่ของตกแต่ง' : 'เพิ่มหมวดหมู่ของตกแต่ง'}
              </h3>
              <button
                onClick={() => setEditingCat(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ชื่อหมวดหมู่ของตกแต่ง *
                </label>
                <input
                  type="text"
                  required
                  value={editingCat.name || ''}
                  onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                  placeholder="เช่น โบว์และริบบิ้น"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  อยู่ภายใต้หมวดหมู่หลัก (Parent Category - เว้นว่างหากเป็นหมวดหลัก)
                </label>
                <select
                  value={editingCat.parent_id || ''}
                  onChange={(e) =>
                    setEditingCat({ ...editingCat, parent_id: e.target.value || null })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
                >
                  <option value="">— เป็นหมวดหมู่ระดับหลัก (Root) —</option>
                  {rootCategories
                    .filter((r) => r.id !== editingCat.id)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  โทนสีเริ่มต้นที่แนะนำ (ไม่บังคับ)
                </label>
                <select
                  value={editingCat.default_color_id || ''}
                  onChange={(e) =>
                    setEditingCat({ ...editingCat, default_color_id: e.target.value || null })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
                >
                  <option value="">รองรับทุกโทนสี</option>
                  {decorationColors.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  rows={2}
                  value={editingCat.description || ''}
                  onChange={(e) => setEditingCat({ ...editingCat, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingCat.is_active ?? true}
                  onChange={(e) => setEditingCat({ ...editingCat, is_active: e.target.checked })}
                  className="rounded text-pink-500"
                />
                เปิดแสดงผลหมวดหมู่นี้
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกหมวดหมู่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// #9 Manage Decorations (/admin/decorations) — Strictly FREE (0 THB)
// ============================================================================
export const AdminManageDecorationsPage: React.FC = () => {
  const {
    decorations,
    decorationColors,
    decorationCategories,
    upsertDecoration,
    deleteDecoration,
  } = useStore();

  const [search, setSearch] = useState('');
  const [filterColorId, setFilterColorId] = useState('ALL');
  const [filterCategoryId, setFilterCategoryId] = useState('ALL');
  const [editingDec, setEditingDec] = useState<Partial<DecorationItem> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    return [...decorations]
      .filter((d) => {
        if (filterColorId !== 'ALL' && d.color_id !== filterColorId) return false;
        if (filterCategoryId !== 'ALL' && d.category_id !== filterCategoryId) return false;
        if (
          search.trim() &&
          !d.name.toLowerCase().includes(search.toLowerCase()) &&
          !d.code.toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [decorations, filterColorId, filterCategoryId, search]);

  const openCreate = () => {
    setEditingDec({
      code: `DEC-ITEM-${String(decorations.length + 1).padStart(2, '0')}`,
      name: '',
      color_id: decorationColors[0]?.id || '',
      category_id: decorationCategories[0]?.id || '',
      image_url: '/placeholders/decorations/dec-01.svg',
      price: 0,
      is_free: true,
      sort_order: decorations.length + 1,
      is_active: true,
      is_demo: false,
    });
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingDec) return;
    setIsUploading(true);
    try {
      const { url } = await uploadFileToBucket(file, 'decorations', 'stickers');
      setEditingDec({ ...editingDec, image_url: url });
      toast.success('อัปโหลดรูปของตกแต่งสำเร็จ');
    } catch (err: any) {
      toast.error(err?.message || 'อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDec?.name?.trim() || !editingDec?.code?.trim()) {
      toast.error('กรุณากรอกรหัสและชื่อของตกแต่ง');
      return;
    }
    setIsSaving(true);
    try {
      await upsertDecoration({
        ...editingDec,
        code: editingDec.code.trim().toUpperCase(),
        name: editingDec.name.trim(),
        color_id: editingDec.color_id || decorationColors[0]?.id || '',
        category_id: editingDec.category_id || decorationCategories[0]?.id || '',
        price: 0, // Enforced 0 THB Free per PART 9 & PART 13
        is_free: true,
      });
      toast.success('บันทึกของตกแต่งฟรี (0 บาท) เรียบร้อยแล้ว');
      setEditingDec(null);
    } catch (err: any) {
      toast.error(err?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (dec: DecorationItem) => {
    if (!window.confirm(`ยืนยันการลบของตกแต่ง "${dec.name}"?`)) return;
    try {
      await deleteDecoration(dec.id);
      toast.success('ลบของตกแต่งเรียบร้อยแล้ว');
    } catch (err: any) {
      toast.error(err?.message || 'ลบไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-pink-100 shadow-pastel">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <Gift className="w-3.5 h-3.5" />
            Manage Free Decorations (0 บาททุกชิ้น)
          </span>
          <h1 className="text-2xl font-bold text-stone-800">
            จัดการคลังของตกแต่งฟรี ({decorations.length} ชิ้น)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            ของตกแต่งทุกชิ้นถูกล็อกราคาเป็น <strong>ฟรี (0 บาท)</strong> ทั้งระดับ UI และฐานข้อมูล PostgreSQL CHECK Constraint
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          เพิ่มของตกแต่งฟรี
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-pink-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อหรือรหัสของตกแต่ง..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-sm"
          />
        </div>
        <select
          value={filterColorId}
          onChange={(e) => setFilterColorId(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-stone-200 text-sm text-stone-700"
        >
          <option value="ALL">ทุกโทนสี</option>
          {decorationColors.map((col) => (
            <option key={col.id} value={col.id}>
              {col.name}
            </option>
          ))}
        </select>
        <select
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-stone-200 text-sm text-stone-700"
        >
          <option value="ALL">ทุกหมวดหมู่ของตกแต่ง</option>
          {decorationCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.parent_id ? `↳ ${cat.name}` : cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Decorations Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map((dec) => {
          const color = decorationColors.find((c) => c.id === dec.color_id);
          const cat = decorationCategories.find((c) => c.id === dec.category_id);
          return (
            <div
              key={dec.id}
              className="bg-white rounded-3xl border border-pink-100 p-3.5 shadow-xs flex flex-col justify-between gap-3"
            >
              <div>
                <div className="relative aspect-square rounded-2xl bg-pink-50/40 border border-pink-50 flex items-center justify-center p-3">
                  <img
                    src={dec.image_url}
                    alt={dec.name}
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                    ฟรี 0฿
                  </span>
                </div>
                <div className="mt-2.5 space-y-1">
                  <div className="flex items-center gap-1.5">
                    {color && (
                      <span
                        className="w-3 h-3 rounded-full border border-stone-300 shrink-0"
                        style={{ backgroundColor: color.hex_code }}
                      />
                    )}
                    <span className="text-[11px] text-stone-500 truncate">
                      {cat?.name || 'ทั่วไป'}
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-800 text-xs line-clamp-1">{dec.name}</h4>
                  <p className="text-[10px] font-mono text-stone-400">{dec.code}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <span
                  className={`text-[10px] font-semibold ${
                    dec.is_active ? 'text-emerald-600' : 'text-stone-400'
                  }`}
                >
                  {dec.is_active ? 'เปิดใช้' : 'ซ่อน'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingDec(dec)}
                    className="p-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(dec)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingDec && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-pink-100 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-lg text-stone-800">
                {editingDec.id ? 'แก้ไขของตกแต่งฟรี' : 'เพิ่มของตกแต่งฟรีใหม่'}
              </h3>
              <button
                onClick={() => setEditingDec(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ชื่อของตกแต่ง *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDec.name || ''}
                    onChange={(e) => setEditingDec({ ...editingDec, name: e.target.value })}
                    placeholder="เช่น โบว์ชมพูพาสเทล"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    รหัส (Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDec.code || ''}
                    onChange={(e) => setEditingDec({ ...editingDec, code: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    หมวดหมู่สี (Color) *
                  </label>
                  <select
                    value={editingDec.color_id || ''}
                    onChange={(e) => setEditingDec({ ...editingDec, color_id: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  >
                    {decorationColors.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    หมวดหมู่ย่อย (Subcategory) *
                  </label>
                  <select
                    value={editingDec.category_id || ''}
                    onChange={(e) => setEditingDec({ ...editingDec, category_id: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  >
                    {decorationCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parent_id ? `↳ ${cat.name}` : cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Lock Banner */}
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800">
                  ราคาของตกแต่ง (ล็อกตามข้อกำหนดระบบ)
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">
                  ฟรี 0 บาท (FREE)
                </span>
              </div>

              {/* Image Upload */}
              <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-3">
                <label className="block text-xs font-semibold text-stone-700">
                  รูปภาพของตกแต่ง (PNG พื้นหลังใส / SVG)
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={editingDec.image_url || '/placeholders/decorations/dec-01.svg'}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-contain bg-white border border-pink-200 p-2"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editingDec.image_url || ''}
                      onChange={(e) =>
                        setEditingDec({ ...editingDec, image_url: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-pink-600 text-xs font-semibold cursor-pointer hover:bg-pink-50">
                      <Upload className="w-3.5 h-3.5" />
                      {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์ของตกแต่ง'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleUploadImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingDec.is_active ?? true}
                  onChange={(e) => setEditingDec({ ...editingDec, is_active: e.target.checked })}
                  className="rounded text-pink-500"
                />
                เปิดแสดงให้ลูกค้าเลือกใช้งานได้
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingDec(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกของตกแต่ง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// #10 Manage Form Fields (/admin/form-fields) — Dynamic Form Builder per Sign Type
// ============================================================================
const FIELD_TYPE_LABELS: Record<DynamicFieldType, string> = {
  text: 'ข้อความบรรทัดเดียว (Text)',
  textarea: 'ข้อความหลายบรรทัด (Textarea)',
  number: 'ตัวเลข (Number)',
  select: 'ตัวเลือก Dropdown (Select)',
  checkbox: 'กล่องติ๊กเลือก (Checkbox)',
  date: 'วันที่ (Date)',
  time: 'เวลา (Time)',
  image_upload: 'อัปโหลดรูปภาพ เช่น QR Code / โลโก้ (Image Upload)',
};

export const AdminManageFormFieldsPage: React.FC = () => {
  const { signCategories, productFields, upsertProductField, deleteProductField } = useStore();
  const [selectedSignCategoryId, setSelectedSignCategoryId] = useState<string>(
    signCategories[0]?.id || ''
  );
  const [editingField, setEditingField] = useState<Partial<ProductField> | null>(null);
  const [optionsText, setOptionsText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activeCategory = signCategories.find((c) => c.id === selectedSignCategoryId);

  const fieldsForCategory = useMemo(() => {
    return [...productFields]
      .filter((f) => f.sign_category_id === selectedSignCategoryId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [productFields, selectedSignCategoryId]);

  const openCreate = () => {
    setEditingField({
      sign_category_id: selectedSignCategoryId,
      field_key: '',
      label: '',
      placeholder: '',
      field_type: 'text',
      options: [],
      is_required: true,
      help_text: '',
      is_sensitive: false,
      sort_order: fieldsForCategory.length + 1,
      is_active: true,
      is_demo: false,
    });
    setOptionsText('');
  };

  const openEdit = (field: ProductField) => {
    setEditingField(field);
    setOptionsText((field.options || []).join('\n'));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField?.label?.trim()) {
      toast.error('กรุณากรอกชื่อช่องข้อมูล (Label)');
      return;
    }
    const fieldKey =
      editingField.field_key?.trim() ||
      `field_${Date.now().toString().slice(-5)}`;
    const options =
      editingField.field_type === 'select'
        ? optionsText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    setIsSaving(true);
    try {
      await upsertProductField({
        ...editingField,
        sign_category_id: editingField.sign_category_id || selectedSignCategoryId,
        field_key: fieldKey,
        label: editingField.label.trim(),
        options,
      });
      toast.success('บันทึกช่องฟอร์มกรอกข้อมูลเรียบร้อยแล้ว');
      setEditingField(null);
    } catch (err: any) {
      toast.error(err?.message || 'บันทึกช่องฟอร์มไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (field: ProductField) => {
    if (!window.confirm(`ยืนยันการลบช่องข้อมูล "${field.label}"?`)) return;
    try {
      await deleteProductField(field.id);
      toast.success('ลบช่องข้อมูลเรียบร้อยแล้ว');
    } catch (err: any) {
      toast.error(err?.message || 'ลบไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-pink-100 shadow-pastel">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5" />
            Manage Dynamic Form Fields (Part 10)
          </span>
          <h1 className="text-2xl font-bold text-stone-800">
            จัดการฟอร์มกรอกข้อมูลรายประเภทป้าย (Dynamic Form Builder)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            กำหนดช่องข้อมูลสำหรับป้ายแต่ละประเภท รองรับ Text, Textarea, Number, Select, Checkbox, Date, Time และ Image Upload
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          เพิ่มช่องข้อมูลใหม่ในป้ายนี้
        </button>
      </div>

      {/* Category Selector */}
      <div className="bg-white p-5 rounded-3xl border border-pink-100 space-y-3">
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
          เลือกประเภทป้ายที่ต้องการตั้งค่าแบบฟอร์ม:
        </label>
        <div className="flex flex-wrap gap-2">
          {signCategories.map((cat) => {
            const count = productFields.filter((f) => f.sign_category_id === cat.id).length;
            const isSelected = cat.id === selectedSignCategoryId;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedSignCategoryId(cat.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-pink-500 text-white shadow-xs'
                    : 'bg-stone-50 hover:bg-pink-50 text-stone-700 border border-stone-200/80'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fields List */}
      <div className="bg-white rounded-3xl border border-pink-100 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-pink-100 flex items-center justify-between bg-pink-50/40">
          <div>
            <h2 className="font-bold text-stone-800 text-base">
              แบบฟอร์มของ: <span className="text-pink-600">{activeCategory?.name}</span>
            </h2>
            <p className="text-xs text-stone-500">
              มีช่องกรอกข้อมูลทั้งหมด {fieldsForCategory.length} ช่อง (เรียงตามลำดับการแสดงผล)
            </p>
          </div>
          {activeCategory?.requires_sensitive_review && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              ป้ายนี้เปิดโหมดให้ลูกค้ายืนยันความถูกต้องข้อมูลสำคัญ
            </span>
          )}
        </div>

        <div className="divide-y divide-stone-100">
          {fieldsForCategory.length === 0 ? (
            <div className="p-10 text-center text-stone-500 text-sm">
              ยังไม่มีช่องข้อมูลสำหรับป้ายประเภทนี้ คลิกปุ่ม &ldquo;เพิ่มช่องข้อมูลใหม่ในป้ายนี้&rdquo; ด้านบน
            </div>
          ) : (
            fieldsForCategory.map((field) => (
              <div
                key={field.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-pink-50/20"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600">
                      #{field.sort_order}
                    </span>
                    <span className="font-bold text-stone-800 text-sm">{field.label}</span>
                    {field.is_required ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-semibold">
                        จำเป็นต้องกรอก *
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                        ไม่บังคับ
                      </span>
                    )}
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 font-medium">
                      {FIELD_TYPE_LABELS[field.field_type]}
                    </span>
                    {field.is_sensitive && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                        ข้อมูลสำคัญ (ซ่อนบางส่วนในหน้าติดตามพัสดุ)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-stone-500">
                    Key: <code className="text-stone-700">{field.field_key}</code>
                    {field.placeholder && ` • ตัวอย่าง: "${field.placeholder}"`}
                  </div>
                  {field.field_type === 'select' && field.options.length > 0 && (
                    <div className="text-xs text-pink-600">
                      ตัวเลือก: {field.options.join(' | ')}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(field)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-pink-50 text-pink-700 text-xs font-semibold hover:bg-pink-100"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(field)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    ลบ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editingField && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-pink-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-lg text-stone-800">
                {editingField.id ? 'แก้ไขช่องกรอกข้อมูล' : 'เพิ่มช่องกรอกข้อมูลใหม่'}
              </h3>
              <button
                onClick={() => setEditingField(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ชื่อช่องข้อมูลที่แสดงให้ลูกค้าเห็น (Label) *
                </label>
                <input
                  type="text"
                  required
                  value={editingField.label || ''}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                  placeholder="เช่น ชื่อธนาคาร, เลขที่บัญชี, ชื่อร้าน"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ชนิดของช่องข้อมูล (Field Type) *
                  </label>
                  <select
                    value={editingField.field_type || 'text'}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        field_type: e.target.value as DynamicFieldType,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  >
                    {(Object.keys(FIELD_TYPE_LABELS) as DynamicFieldType[]).map((type) => (
                      <option key={type} value={type}>
                        {FIELD_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ลำดับการแสดงผล
                  </label>
                  <input
                    type="number"
                    value={editingField.sort_order ?? 1}
                    onChange={(e) =>
                      setEditingField({ ...editingField, sort_order: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Field Key (ภาษาอังกฤษ)
                  </label>
                  <input
                    type="text"
                    value={editingField.field_key || ''}
                    onChange={(e) =>
                      setEditingField({ ...editingField, field_key: e.target.value })
                    }
                    placeholder="bank_account_no"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ข้อความตัวอย่าง (Placeholder)
                  </label>
                  <input
                    type="text"
                    value={editingField.placeholder || ''}
                    onChange={(e) =>
                      setEditingField({ ...editingField, placeholder: e.target.value })
                    }
                    placeholder="เช่น 123-4-56789-0"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              {editingField.field_type === 'select' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ตัวเลือกใน Dropdown (บรรทัดละ 1 ตัวเลือก) *
                  </label>
                  <textarea
                    rows={4}
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder={'กสิกรไทย (KBank)\nไทยพาณิชย์ (SCB)\nกรุงเทพ (BBL)'}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  คำแนะนำเพิ่มเติมใต้ช่องกรอก (Help Text)
                </label>
                <input
                  type="text"
                  value={editingField.help_text || ''}
                  onChange={(e) =>
                    setEditingField({ ...editingField, help_text: e.target.value })
                  }
                  placeholder="กรุณาตรวจสอบตัวสะกดและตัวเลขให้ถูกต้องก่อนส่ง"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingField.is_required ?? true}
                    onChange={(e) =>
                      setEditingField({ ...editingField, is_required: e.target.checked })
                    }
                    className="rounded text-pink-500"
                  />
                  บังคับให้ลูกค้าต้องกรอกช่องนี้ (Required)
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-amber-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingField.is_sensitive ?? false}
                    onChange={(e) =>
                      setEditingField({ ...editingField, is_sensitive: e.target.checked })
                    }
                    className="rounded text-amber-500"
                  />
                  เป็นข้อมูลสำคัญ เช่น เลขบัญชีธนาคาร (ระบบจะเน้นสีให้ตรวจสอบซ้ำ และปิดบังบางส่วนเมื่อค้นหาสถานะสาธารณะ)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingField(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกช่องข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
