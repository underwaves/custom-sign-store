import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Eye,
  FolderKanban,
  Image as ImageIcon,
  Layers,
  Palette,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/context/StoreContext';
import { uploadFileToBucket } from '@/lib/supabase';
import { CategoryGroup, SignCategory, SignStyle, SignTemplate } from '@/types/database';
import { formatPrice } from '@/utils/pricing';
import { ImageLightboxModal } from '@/components/common/ImageLightboxModal';

// ============================================================================
// #3 Manage Categories (Category Groups) (/admin/categories)
// ============================================================================
export const AdminManageCategoriesPage: React.FC = () => {
  const { categoryGroups, signCategories, upsertCategoryGroup, deleteCategoryGroup } = useStore();
  const [editingGroup, setEditingGroup] = useState<Partial<CategoryGroup> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setEditingGroup({
      name: '',
      slug: '',
      description: '',
      icon_name: 'Sparkles',
      sort_order: categoryGroups.length + 1,
      is_active: true,
      is_demo: false,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup?.name?.trim()) {
      toast.error('กรุณาระบุชื่อหมวดหมู่หลัก');
      return;
    }
    const slug =
      editingGroup.slug?.trim() ||
      editingGroup.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9ก-๙]+/g, '-');

    setIsSaving(true);
    try {
      await upsertCategoryGroup({
        ...editingGroup,
        name: editingGroup.name.trim(),
        slug,
      });
      toast.success('บันทึกหมวดหมู่หลักเรียบร้อยแล้ว');
      setEditingGroup(null);
    } catch (err: any) {
      toast.error(err?.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (group: CategoryGroup) => {
    const linkedCount = signCategories.filter((c) => c.group_id === group.id).length;
    if (
      !window.confirm(
        `ยืนยันการลบหมวดหมู่ "${group.name}"? ${
          linkedCount > 0 ? `(มีประเภทป้ายในหมวดนี้ ${linkedCount} รายการ)` : ''
        }`
      )
    ) {
      return;
    }
    try {
      await deleteCategoryGroup(group.id);
      toast.success(`ลบหมวดหมู่ "${group.name}" เรียบร้อยแล้ว`);
    } catch (err: any) {
      toast.error(err?.message || 'ไม่สามารถลบหมวดหมู่ได้');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-pink-100 shadow-pastel">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold mb-2">
            <FolderKanban className="w-3.5 h-3.5" />
            Manage Categories
          </span>
          <h1 className="text-2xl font-bold text-stone-800">จัดการกลุ่มหมวดหมู่ป้าย (Category Groups)</h1>
          <p className="text-sm text-stone-500 mt-1">
            จัดกลุ่มประเภทป้ายเพื่อให้ลูกค้าค้นหาป้ายที่ต้องการได้ง่ายในหน้าเลือกประเภทป้าย
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          เพิ่มกลุ่มหมวดหมู่ใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...categoryGroups]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((group) => {
            const itemsInGroup = signCategories.filter(
              (c) => c.group_id === group.id || c.group_name === group.name
            );
            return (
              <div
                key={group.id}
                className="bg-white rounded-3xl border border-pink-100 p-5 shadow-sm flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
                        ลำดับ #{group.sort_order}
                      </span>
                      <h3 className="font-bold text-stone-800 text-lg">{group.name}</h3>
                      {group.is_demo && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Demo
                        </span>
                      )}
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                          group.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {group.is_active ? 'เปิดใช้งาน' : 'ปิดซ่อน'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 font-mono mt-1">slug: {group.slug}</p>
                    <p className="text-sm text-stone-600 mt-2">{group.description}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs text-stone-500">
                    มีประเภทป้ายในกลุ่มนี้{' '}
                    <strong className="text-pink-600">{itemsInGroup.length}</strong> ประเภท
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingGroup(group)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-semibold transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(group)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {editingGroup && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-pink-100 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-lg text-stone-800">
                {editingGroup.id ? 'แก้ไขกลุ่มหมวดหมู่' : 'เพิ่มกลุ่มหมวดหมู่ใหม่'}
              </h3>
              <button
                onClick={() => setEditingGroup(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ชื่อกลุ่มหมวดหมู่ *
                </label>
                <input
                  type="text"
                  required
                  value={editingGroup.name || ''}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  placeholder="เช่น ป้ายข้อมูลร้านและชำระเงิน"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-pink-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Slug (ภาษาอังกฤษ)
                  </label>
                  <input
                    type="text"
                    value={editingGroup.slug || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup, slug: e.target.value })}
                    placeholder="shop-and-payment"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-pink-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ลำดับการแสดงผล
                  </label>
                  <input
                    type="number"
                    value={editingGroup.sort_order ?? 1}
                    onChange={(e) =>
                      setEditingGroup({ ...editingGroup, sort_order: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-pink-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  คำอธิบายหมวดหมู่
                </label>
                <textarea
                  rows={3}
                  value={editingGroup.description || ''}
                  onChange={(e) =>
                    setEditingGroup({ ...editingGroup, description: e.target.value })
                  }
                  placeholder="อธิบายสั้น ๆ เกี่ยวกับป้ายในกลุ่มนี้..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-pink-400 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingGroup.is_active ?? true}
                  onChange={(e) =>
                    setEditingGroup({ ...editingGroup, is_active: e.target.checked })
                  }
                  className="rounded text-pink-500 focus:ring-pink-400"
                />
                เปิดแสดงผลบนหน้าร้าน
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold shadow-sm disabled:opacity-50"
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
// #4 Manage Sign Types (/admin/sign-types)
// ============================================================================
export const AdminManageSignTypesPage: React.FC = () => {
  const {
    signCategories,
    categoryGroups,
    signTemplates,
    productFields,
    upsertSignCategory,
    deleteSignCategory,
  } = useStore();

  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [editingSign, setEditingSign] = useState<Partial<SignCategory> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    return [...signCategories]
      .filter((c) => {
        if (selectedGroup !== 'ALL' && c.group_id !== selectedGroup && c.group_name !== selectedGroup) {
          return false;
        }
        if (
          search.trim() &&
          !c.name.toLowerCase().includes(search.toLowerCase()) &&
          !c.short_description.toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [signCategories, selectedGroup, search]);

  const openCreate = () => {
    const firstGroup = categoryGroups[0];
    setEditingSign({
      group_id: firstGroup?.id || null,
      group_name: firstGroup?.name || 'ป้ายทั่วไป',
      name: '',
      slug: '',
      short_description: '',
      description: '',
      preview_image_url: '/placeholders/signs/sign-01.svg',
      base_price: 89,
      is_popular: false,
      is_recommended: false,
      requires_sensitive_review: false,
      sort_order: signCategories.length + 1,
      is_active: true,
      is_demo: false,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSign) return;
    setIsUploading(true);
    try {
      const { url } = await uploadFileToBucket(file, 'site-assets', 'sign-types');
      setEditingSign({ ...editingSign, preview_image_url: url });
      toast.success('อัปโหลดภาพตัวอย่างประเภทป้ายสำเร็จ');
    } catch (err: any) {
      toast.error(err?.message || 'อัปโหลดรูปภาพไม่สำเร็จ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSign?.name?.trim()) {
      toast.error('กรุณากรอกชื่อประเภทป้าย');
      return;
    }
    const slug =
      editingSign.slug?.trim() ||
      `sign-${Date.now().toString().slice(-5)}`;
    const matchedGroup = categoryGroups.find((g) => g.id === editingSign.group_id);

    setIsSaving(true);
    try {
      await upsertSignCategory({
        ...editingSign,
        name: editingSign.name.trim(),
        slug,
        group_name: matchedGroup?.name || editingSign.group_name || 'ป้ายทั่วไป',
        base_price: Math.max(0, Number(editingSign.base_price ?? 89)),
      });
      toast.success('บันทึกข้อมูลประเภทป้ายเรียบร้อยแล้ว');
      setEditingSign(null);
    } catch (err: any) {
      toast.error(err?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (sign: SignCategory) => {
    if (!window.confirm(`ยืนยันการลบประเภทป้าย "${sign.name}"?`)) return;
    try {
      await deleteSignCategory(sign.id);
      toast.success(`ลบประเภทป้าย "${sign.name}" เรียบร้อยแล้ว`);
    } catch (err: any) {
      toast.error(err?.message || 'ลบไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-pink-100 shadow-pastel">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            Manage Sign Types (15+ Types)
          </span>
          <h1 className="text-2xl font-bold text-stone-800">จัดการประเภทป้ายทั้งหมด ({signCategories.length} ประเภท)</h1>
          <p className="text-sm text-stone-500 mt-1">
            เพิ่ม ลบ แก้ไขประเภทป้าย ตั้งราคาเริ่มต้น และกำหนดป้ายยอดนิยมหรือป้ายที่ต้องยืนยันข้อมูลสำคัญ (เช่น เลขบัญชี)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          เพิ่มประเภทป้ายใหม่
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-pink-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อประเภทป้าย หรือคำอธิบาย..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-sm focus:border-pink-400 focus:outline-none"
          />
        </div>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="px-4 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 focus:border-pink-400 focus:outline-none"
        >
          <option value="ALL">ทุกกลุ่มหมวดหมู่ ({signCategories.length})</option>
          {categoryGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid of Sign Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sign) => {
          const tplCount = signTemplates.filter((t) => t.sign_category_id === sign.id).length;
          const fieldCount = productFields.filter((f) => f.sign_category_id === sign.id).length;
          return (
            <div
              key={sign.id}
              className="bg-white rounded-3xl border border-pink-100 overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/10 bg-pink-50/50 border-b border-pink-50">
                  <img
                    src={sign.preview_image_url}
                    alt={sign.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-stone-700 text-xs font-bold shadow-xs">
                      #{sign.sort_order}
                    </span>
                    {sign.is_popular && (
                      <span className="px-2.5 py-1 rounded-full bg-pink-500 text-white text-xs font-semibold shadow-xs">
                        ยอดนิยม
                      </span>
                    )}
                    {sign.requires_sensitive_review && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-semibold shadow-xs">
                        ตรวจเลขบัญชี
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="px-3 py-1 rounded-full bg-stone-900/80 text-white text-xs font-bold">
                      เริ่ม {formatPrice(sign.base_price)}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full">
                      {sign.group_name}
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        sign.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {sign.is_active ? 'เปิดขาย' : 'ปิดซ่อน'}
                    </span>
                  </div>
                  <h3 className="font-bold text-stone-800 text-base">{sign.name}</h3>
                  <p className="text-xs text-stone-500 line-clamp-2">{sign.short_description}</p>
                </div>
              </div>

              <div className="px-4 py-3 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between">
                <div className="text-[11px] text-stone-500 space-x-2">
                  <span>เทมเพลต: <strong>{tplCount}</strong></span>
                  <span>•</span>
                  <span>ฟอร์ม: <strong>{fieldCount}</strong> ช่อง</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditingSign(sign)}
                    className="p-2 rounded-xl bg-white hover:bg-pink-50 text-pink-600 border border-pink-100 transition"
                    title="แก้ไข"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(sign)}
                    className="p-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-100 transition"
                    title="ลบ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {editingSign && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl border border-pink-100 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-lg text-stone-800">
                {editingSign.id ? `แก้ไขประเภทป้าย: ${editingSign.name}` : 'เพิ่มประเภทป้ายใหม่'}
              </h3>
              <button
                onClick={() => setEditingSign(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ชื่อประเภทป้าย *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSign.name || ''}
                    onChange={(e) => setEditingSign({ ...editingSign, name: e.target.value })}
                    placeholder="เช่น ป้ายบัญชีธนาคาร"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    กลุ่มหมวดหมู่
                  </label>
                  <select
                    value={editingSign.group_id || ''}
                    onChange={(e) => {
                      const g = categoryGroups.find((item) => item.id === e.target.value);
                      setEditingSign({
                        ...editingSign,
                        group_id: e.target.value || null,
                        group_name: g?.name || 'ป้ายทั่วไป',
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
                  >
                    {categoryGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ราคาเริ่มต้น (บาท) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingSign.base_price ?? 89}
                    onChange={(e) =>
                      setEditingSign({ ...editingSign, base_price: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-bold text-pink-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Slug URL
                  </label>
                  <input
                    type="text"
                    value={editingSign.slug || ''}
                    onChange={(e) => setEditingSign({ ...editingSign, slug: e.target.value })}
                    placeholder="bank-account-sign"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ลำดับการแสดงผล
                  </label>
                  <input
                    type="number"
                    value={editingSign.sort_order ?? 1}
                    onChange={(e) =>
                      setEditingSign({ ...editingSign, sort_order: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  คำอธิบายสั้น (แสดงในการ์ด)
                </label>
                <input
                  type="text"
                  value={editingSign.short_description || ''}
                  onChange={(e) =>
                    setEditingSign({ ...editingSign, short_description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  รายละเอียดเต็ม
                </label>
                <textarea
                  rows={3}
                  value={editingSign.description || ''}
                  onChange={(e) =>
                    setEditingSign({ ...editingSign, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
                />
              </div>

              {/* Image Upload */}
              <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-3">
                <label className="block text-xs font-semibold text-stone-700">
                  รูปภาพตัวอย่างประเภทป้าย (อัปโหลดไปยัง Supabase Storage หรือระบุ URL)
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={editingSign.preview_image_url || '/placeholders/signs/sign-01.svg'}
                    alt="Preview"
                    className="w-24 h-16 rounded-xl object-cover border border-pink-200 bg-white"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editingSign.preview_image_url || ''}
                      onChange={(e) =>
                        setEditingSign({ ...editingSign, preview_image_url: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white"
                      placeholder="/placeholders/signs/sign-01.svg"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-pink-600 text-xs font-semibold cursor-pointer hover:bg-pink-50">
                      <Upload className="w-3.5 h-3.5" />
                      {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพใหม่'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSign.is_active ?? true}
                    onChange={(e) =>
                      setEditingSign({ ...editingSign, is_active: e.target.checked })
                    }
                    className="rounded text-pink-500"
                  />
                  เปิดใช้งาน (แสดงให้ลูกค้าสั่งทำได้)
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSign.is_popular ?? false}
                    onChange={(e) =>
                      setEditingSign({ ...editingSign, is_popular: e.target.checked })
                    }
                    className="rounded text-pink-500"
                  />
                  แสดงเป็นหมวดหมู่ยอดนิยมหน้าแรก
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSign.is_recommended ?? false}
                    onChange={(e) =>
                      setEditingSign({ ...editingSign, is_recommended: e.target.checked })
                    }
                    className="rounded text-pink-500"
                  />
                  แสดงในรายการสินค้าแนะนำ (Featured)
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-amber-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSign.requires_sensitive_review ?? false}
                    onChange={(e) =>
                      setEditingSign({
                        ...editingSign,
                        requires_sensitive_review: e.target.checked,
                      })
                    }
                    className="rounded text-amber-500"
                  />
                  บังคับให้ลูกค้ากดยืนยันความถูกต้องข้อมูลสำคัญ (เช่น เลขบัญชี)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingSign(null)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold shadow-sm"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกประเภทป้าย'}
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
// #5 Manage Styles (/admin/styles)
// ============================================================================
export const AdminManageStylesPage: React.FC = () => {
  const { signStyles, signTemplates, upsertSignStyle } = useStore();
  const [editingStyle, setEditingStyle] = useState<Partial<SignStyle> | null>(null);
  const [featuresText, setFeaturesText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openEdit = (style: SignStyle) => {
    setEditingStyle(style);
    setFeaturesText((style.features || []).join('\n'));
  };

  const openCreate = () => {
    setEditingStyle({
      code: '',
      slug: '',
      name: '',
      tagline: '',
      description: '',
      features: [],
      preview_image_url: '/placeholders/styles/minimal.svg',
      price_modifier: 0,
      sort_order: signStyles.length + 1,
      is_active: true,
      is_demo: false,
    });
    setFeaturesText('คุมโทนสะอาดตา\nอ่านง่ายบนมือถือ');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStyle?.name?.trim() || !editingStyle?.code?.trim()) {
      toast.error('กรุณาระบุชื่อและรหัสสไตล์');
      return;
    }
    setIsSaving(true);
    try {
      const features = featuresText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      await upsertSignStyle({
        ...editingStyle,
        name: editingStyle.name.trim(),
        code: editingStyle.code.trim().toUpperCase(),
        slug: editingStyle.slug?.trim() || editingStyle.code.trim().toLowerCase(),
        features,
        price_modifier: Number(editingStyle.price_modifier ?? 0),
      });
      toast.success('บันทึกข้อมูลสไตล์ป้ายเรียบร้อยแล้ว');
      setEditingStyle(null);
    } catch (err: any) {
      toast.error(err?.message || 'ไม่สามารถบันทึกสไตล์ได้');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-pink-100 shadow-pastel">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Manage Styles (Part 7)
          </span>
          <h1 className="text-2xl font-bold text-stone-800">จัดการสไตล์ป้าย (Minimal / Decorative)</h1>
          <p className="text-sm text-stone-500 mt-1">
            กำหนดคำอธิบาย จุดเด่น และราคาเพิ่มตามสไตล์ (Price Modifier) ซึ่งจะใช้กรองเทมเพลตในขั้นตอนที่ 2 และ 3
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          เพิ่มสไตล์ใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...signStyles]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((style) => {
            const tplCount = signTemplates.filter((t) => t.style_id === style.id).length;
            return (
              <div
                key={style.id}
                className="bg-white rounded-3xl border border-pink-100 overflow-hidden shadow-pastel flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-16/9 bg-pink-50 relative border-b border-pink-100">
                    <img
                      src={style.preview_image_url}
                      alt={style.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-3 py-1 rounded-full bg-white/95 text-stone-800 text-xs font-bold shadow-xs">
                        Code: {style.code}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-pink-500 text-white text-xs font-bold shadow-xs">
                        {style.price_modifier > 0
                          ? `+${formatPrice(style.price_modifier)}`
                          : 'ไม่บวกเพิ่ม (+0 ฿)'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-stone-800">{style.name}</h3>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          style.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {style.is_active ? 'เปิดใช้งาน' : 'ปิดซ่อน'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-pink-600">{style.tagline}</p>
                    <p className="text-sm text-stone-600">{style.description}</p>
                    <ul className="space-y-1.5 pt-2">
                      {style.features.map((feat, i) => (
                        <li key={i} className="text-xs text-stone-600 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs text-stone-500">
                    มีเทมเพลตในสไตล์นี้ <strong>{tplCount}</strong> แบบ
                  </span>
                  <button
                    onClick={() => openEdit(style)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    แก้ไขสไตล์และราคา
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {editingStyle && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-pink-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-lg text-stone-800">
                {editingStyle.id ? `แก้ไขสไตล์: ${editingStyle.name}` : 'เพิ่มสไตล์ใหม่'}
              </h3>
              <button
                onClick={() => setEditingStyle(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ชื่อสไตล์ *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStyle.name || ''}
                    onChange={(e) => setEditingStyle({ ...editingStyle, name: e.target.value })}
                    placeholder="Minimal (มินิมอล)"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    รหัสสไตล์ (Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStyle.code || ''}
                    onChange={(e) => setEditingStyle({ ...editingStyle, code: e.target.value })}
                    placeholder="MINIMAL"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ราคาบวกเพิ่มตามสไตล์ (บาท)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingStyle.price_modifier ?? 0}
                    onChange={(e) =>
                      setEditingStyle({
                        ...editingStyle,
                        price_modifier: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm font-bold text-pink-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ลำดับการแสดงผล
                  </label>
                  <input
                    type="number"
                    value={editingStyle.sort_order ?? 1}
                    onChange={(e) =>
                      setEditingStyle({ ...editingStyle, sort_order: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ข้อความสโลแกนสั้น (Tagline)
                </label>
                <input
                  type="text"
                  value={editingStyle.tagline || ''}
                  onChange={(e) => setEditingStyle({ ...editingStyle, tagline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  คำอธิบายสไตล์
                </label>
                <textarea
                  rows={2}
                  value={editingStyle.description || ''}
                  onChange={(e) =>
                    setEditingStyle({ ...editingStyle, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  จุดเด่นของสไตล์ (บรรทัดละ 1 ข้อ)
                </label>
                <textarea
                  rows={4}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingStyle.is_active ?? true}
                  onChange={(e) =>
                    setEditingStyle({ ...editingStyle, is_active: e.target.checked })
                  }
                  className="rounded text-pink-500"
                />
                เปิดใช้งานสไตล์นี้
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingStyle(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกสไตล์'}
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
// #6 Manage Templates (/admin/templates)
// ============================================================================
export const AdminManageTemplatesPage: React.FC = () => {
  const {
    signTemplates,
    signCategories,
    signStyles,
    upsertSignTemplate,
    deleteSignTemplate,
  } = useStore();

  const [search, setSearch] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('ALL');
  const [filterStyleId, setFilterStyleId] = useState('ALL');
  const [editingTpl, setEditingTpl] = useState<Partial<SignTemplate> | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewLightbox, setPreviewLightbox] = useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  const filtered = useMemo(() => {
    return [...signTemplates]
      .filter((t) => {
        if (filterCategoryId !== 'ALL' && t.sign_category_id !== filterCategoryId) return false;
        if (filterStyleId !== 'ALL' && t.style_id !== filterStyleId) return false;
        if (
          search.trim() &&
          !t.name.toLowerCase().includes(search.toLowerCase()) &&
          !t.code.toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [signTemplates, filterCategoryId, filterStyleId, search]);

  const openCreate = () => {
    const defaultCat = signCategories[0];
    const defaultStyle = signStyles[0];
    setEditingTpl({
      code: `TPL-${String(signTemplates.length + 1).padStart(3, '0')}`,
      name: '',
      sign_category_id: defaultCat?.id || '',
      style_id: defaultStyle?.id || '',
      preview_image_url: '/placeholders/templates/MIN-001.svg',
      description: '',
      sample_tags: ['พาสเทล', 'อ่านง่าย'],
      base_price_override: null,
      is_popular: false,
      is_featured_sample: true,
      status: 'published',
      sort_order: signTemplates.length + 1,
      is_active: true,
      is_demo: false,
    });
    setTagsInput('พาสเทล, อ่านง่าย');
  };

  const openEdit = (tpl: SignTemplate) => {
    setEditingTpl(tpl);
    setTagsInput((tpl.sample_tags || []).join(', '));
  };

  const handleUploadTemplateImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingTpl) return;
    setIsUploading(true);
    try {
      const { url } = await uploadFileToBucket(file, 'sign-templates', 'templates');
      setEditingTpl({ ...editingTpl, preview_image_url: url });
      toast.success('อัปโหลดภาพเทมเพลตสำเร็จ');
    } catch (err: any) {
      toast.error(err?.message || 'อัปโหลดรูปภาพไม่สำเร็จ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTpl?.name?.trim() || !editingTpl?.code?.trim()) {
      toast.error('กรุณากรอกรหัสเทมเพลตและชื่อเทมเพลต');
      return;
    }
    if (!editingTpl.sign_category_id || !editingTpl.style_id) {
      toast.error('กรุณาเลือกประเภทป้ายและสไตล์ของเทมเพลต');
      return;
    }

    setIsSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await upsertSignTemplate({
        ...editingTpl,
        code: editingTpl.code.trim().toUpperCase(),
        name: editingTpl.name.trim(),
        sign_category_id: editingTpl.sign_category_id,
        style_id: editingTpl.style_id,
        sample_tags: tags,
      });
      toast.success('บันทึกเทมเพลตเรียบร้อยแล้ว');
      setEditingTpl(null);
    } catch (err: any) {
      toast.error(err?.message || 'บันทึกเทมเพลตไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tpl: SignTemplate) => {
    if (!window.confirm(`ยืนยันการลบเทมเพลต "${tpl.code} - ${tpl.name}"?`)) return;
    try {
      await deleteSignTemplate(tpl.id);
      toast.success('ลบเทมเพลตเรียบร้อยแล้ว');
    } catch (err: any) {
      toast.error(err?.message || 'ลบเทมเพลตไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-pink-100 shadow-pastel">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold mb-2">
            <ImageIcon className="w-3.5 h-3.5" />
            Manage Templates (Part 8)
          </span>
          <h1 className="text-2xl font-bold text-stone-800">
            จัดการภาพตัวอย่างเทมเพลตป้าย ({signTemplates.length} เทมเพลต)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            อัปโหลดภาพตัวอย่างเทมเพลต ผูกกับประเภทป้ายและสไตล์ (Minimal / Decorative) เพื่อให้ระบบกรองอัตโนมัติ
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          เพิ่มเทมเพลตใหม่
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
            placeholder="ค้นหารหัส MIN-001, DEC-001 หรือชื่อเทมเพลต..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-sm"
          />
        </div>
        <select
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-stone-200 text-sm text-stone-700"
        >
          <option value="ALL">ทุกประเภทป้าย</option>
          {signCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filterStyleId}
          onChange={(e) => setFilterStyleId(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-stone-200 text-sm text-stone-700"
        >
          <option value="ALL">ทุกสไตล์ (Minimal & Decorative)</option>
          {signStyles.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((tpl) => {
          const cat = signCategories.find((c) => c.id === tpl.sign_category_id);
          const style = signStyles.find((s) => s.id === tpl.style_id);
          return (
            <div
              key={tpl.id}
              className="bg-white rounded-3xl border border-pink-100 overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-4/3 bg-pink-50/40 group">
                  <img
                    src={tpl.preview_image_url}
                    alt={tpl.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewLightbox({
                        url: tpl.preview_image_url,
                        title: `${tpl.code} - ${tpl.name}`,
                        subtitle: `${cat?.name || ''} • ${style?.name || ''}`,
                      })
                    }
                    className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1.5"
                  >
                    <Eye className="w-4 h-4" /> ดูภาพขยาย
                  </button>
                  <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-900/80 text-white text-[11px] font-mono font-bold">
                      {tpl.code}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        style?.code === 'MINIMAL'
                          ? 'bg-stone-100 text-stone-700'
                          : 'bg-pink-500 text-white'
                      }`}
                    >
                      {style?.name || 'Style'}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-1.5">
                  <div className="text-[11px] text-pink-600 font-semibold truncate">
                    {cat?.name || 'ไม่ระบุประเภทป้าย'}
                  </div>
                  <h3 className="font-bold text-stone-800 text-sm line-clamp-1">{tpl.name}</h3>
                  <p className="text-xs text-stone-500 line-clamp-2">{tpl.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {tpl.sample_tags?.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    tpl.is_active && tpl.status === 'published'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {tpl.is_active && tpl.status === 'published' ? 'เผยแพร่' : 'ซ่อน/ร่าง'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(tpl)}
                    className="p-1.5 rounded-xl bg-white border border-pink-100 text-pink-600 hover:bg-pink-50"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tpl)}
                    className="p-1.5 rounded-xl bg-white border border-rose-100 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit/Create Modal */}
      {editingTpl && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl border border-pink-100 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-lg text-stone-800">
                {editingTpl.id ? `แก้ไขเทมเพลต: ${editingTpl.code}` : 'เพิ่มเทมเพลตใหม่'}
              </h3>
              <button
                onClick={() => setEditingTpl(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    รหัสเทมเพลต (Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTpl.code || ''}
                    onChange={(e) => setEditingTpl({ ...editingTpl, code: e.target.value })}
                    placeholder="MIN-011 หรือ DEC-011"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ชื่อเทมเพลต *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTpl.name || ''}
                    onChange={(e) => setEditingTpl({ ...editingTpl, name: e.target.value })}
                    placeholder="เช่น Minimal Clean Cream"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ประเภทป้าย (Sign Type) *
                  </label>
                  <select
                    required
                    value={editingTpl.sign_category_id || ''}
                    onChange={(e) =>
                      setEditingTpl({ ...editingTpl, sign_category_id: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  >
                    {signCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (เริ่ม {formatPrice(c.base_price)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    สไตล์ของเทมเพลต (Style) *
                  </label>
                  <select
                    required
                    value={editingTpl.style_id || ''}
                    onChange={(e) => setEditingTpl({ ...editingTpl, style_id: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  >
                    {signStyles.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  คำอธิบายเทมเพลต
                </label>
                <textarea
                  rows={2}
                  value={editingTpl.description || ''}
                  onChange={(e) =>
                    setEditingTpl({ ...editingTpl, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    แท็ก (คั่นด้วยเครื่องหมายจุลภาค ,)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="มินิมอล, คาเฟ่, อ่านง่าย"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ราคาเริ่มต้นเฉพาะเทมเพลตนี้ (เว้นว่างเพื่อใช้ราคาตามประเภทป้าย)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingTpl.base_price_override ?? ''}
                    onChange={(e) =>
                      setEditingTpl({
                        ...editingTpl,
                        base_price_override:
                          e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    placeholder="ใช้ราคาตามประเภทป้าย"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-3">
                <label className="block text-xs font-semibold text-stone-700">
                  ภาพตัวอย่างเทมเพลต (Supabase Storage: sign-templates)
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={editingTpl.preview_image_url || '/placeholders/templates/MIN-001.svg'}
                    alt="Template Preview"
                    className="w-28 h-20 rounded-xl object-cover border border-pink-200 bg-white"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editingTpl.preview_image_url || ''}
                      onChange={(e) =>
                        setEditingTpl({ ...editingTpl, preview_image_url: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-pink-600 text-xs font-semibold cursor-pointer hover:bg-pink-50">
                      <Upload className="w-3.5 h-3.5" />
                      {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพเทมเพลต'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleUploadTemplateImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTpl.is_active ?? true}
                    onChange={(e) =>
                      setEditingTpl({
                        ...editingTpl,
                        is_active: e.target.checked,
                        status: e.target.checked ? 'published' : 'draft',
                      })
                    }
                    className="rounded text-pink-500"
                  />
                  เปิดใช้งานเทมเพลตนี้
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTpl.is_popular ?? false}
                    onChange={(e) =>
                      setEditingTpl({ ...editingTpl, is_popular: e.target.checked })
                    }
                    className="rounded text-pink-500"
                  />
                  เทมเพลตยอดนิยม
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTpl.is_featured_sample ?? false}
                    onChange={(e) =>
                      setEditingTpl({ ...editingTpl, is_featured_sample: e.target.checked })
                    }
                    className="rounded text-pink-500"
                  />
                  แสดงเป็นผลงานตัวอย่างหน้าแรก
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingTpl(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกเทมเพลต'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ImageLightboxModal
        isOpen={Boolean(previewLightbox)}
        imageUrl={previewLightbox?.url || ''}
        title={previewLightbox?.title || ''}
        subtitle={previewLightbox?.subtitle}
        onClose={() => setPreviewLightbox(null)}
      />
    </div>
  );
};
