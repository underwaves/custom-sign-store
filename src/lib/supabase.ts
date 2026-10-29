import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

export const isSupabaseConfigured: boolean =
  Boolean(rawUrl && rawAnonKey) &&
  !rawUrl.includes('YOUR-PROJECT-REF') &&
  !rawAnonKey.includes('YOUR-ANON-PUBLIC-KEY') &&
  rawUrl.startsWith('http');

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawUrl, rawAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export type StorageBucketName =
  | 'site-assets'
  | 'sign-templates'
  | 'decorations'
  | 'customer-references';

export function validateUploadFile(
  file: File,
  bucket: StorageBucketName
): { valid: boolean; error?: string } {
  const maxBytes = bucket === 'decorations' ? 3 * 1024 * 1024 : 5 * 1024 * 1024;
  const allowedTypes =
    bucket === 'customer-references'
      ? ['image/png', 'image/jpeg', 'image/webp']
      : ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `ประเภทไฟล์ไม่รองรับ (${file.type || 'ไม่ทราบชนิด'}) กรุณาอัปโหลดไฟล์ PNG, JPG หรือ WEBP`,
    };
  }

  if (file.size > maxBytes) {
    const maxMB = Math.round(maxBytes / (1024 * 1024));
    return {
      valid: false,
      error: `ขนาดไฟล์ใหญ่เกินไป (${(file.size / (1024 * 1024)).toFixed(2)} MB) จำกัดไม่เกิน ${maxMB} MB`,
    };
  }

  return { valid: true };
}

/**
 * Uploads an image file to Supabase Storage (when connected) and returns a URL or storage path.
 * Never stores Base64 in the database: when in unconfigured sandbox preview mode, uses a session Object URL
 * or clean storage path reference.
 */
export async function uploadFileToBucket(
  file: File,
  bucket: StorageBucketName,
  folder = 'uploads'
): Promise<{ url: string; storagePath: string }> {
  const validation = validateUploadFile(file, bucket);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `${folder}/${safeName}`;

  if (supabase) {
    const { error } = await supabase.storage.from(bucket).upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) {
      throw new Error(`อัปโหลดไฟล์ไปยัง Supabase Storage (${bucket}) ไม่สำเร็จ: ${error.message}`);
    }

    if (bucket === 'customer-references') {
      // Private bucket: store storagePath, not a public URL
      return {
        url: `storage://customer-references/${storagePath}`,
        storagePath: `customer-references/${storagePath}`,
      };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    return { url: data.publicUrl, storagePath: `${bucket}/${storagePath}` };
  }

  // Sandbox fallback (when Supabase .env.local is not yet configured by project owner)
  const objectUrl = URL.createObjectURL(file);
  return {
    url: objectUrl,
    storagePath: `${bucket}/${storagePath}`,
  };
}
