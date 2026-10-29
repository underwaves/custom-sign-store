import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const rawApiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim() ?? '';
const rawAuthDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)?.trim() ?? '';
const rawProjectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined)?.trim() ?? '';
const rawStorageBucket = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined)?.trim() ?? '';
const rawMessagingSenderId = (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined)?.trim() ?? '';
const rawAppId = (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined)?.trim() ?? '';

export const isFirebaseConfigured: boolean =
  Boolean(rawApiKey && rawProjectId && rawAppId) &&
  !rawApiKey.includes('YOUR-API-KEY') &&
  !rawProjectId.includes('YOUR-PROJECT-ID');

let firebaseApp: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  const firebaseConfig = {
    apiKey: rawApiKey,
    authDomain: rawAuthDomain || `${rawProjectId}.firebaseapp.com`,
    projectId: rawProjectId,
    storageBucket: rawStorageBucket || `${rawProjectId}.appspot.com`,
    messagingSenderId: rawMessagingSenderId,
    appId: rawAppId,
  };

  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  authInstance = getAuth(firebaseApp);
  dbInstance = getFirestore(firebaseApp);
  storageInstance = getStorage(firebaseApp);
}

export const app = firebaseApp;
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;

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
 * Uploads an image file to Firebase Storage (when connected) and returns a download URL or storage path.
 * When in unconfigured sandbox preview mode, returns a session Object URL.
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
  const storagePath = `${bucket}/${folder}/${safeName}`;

  if (storage) {
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public, max-age=3600',
    });

    if (bucket === 'customer-references') {
      // Private customer reference: path reference or download URL
      const downloadUrl = await getDownloadURL(storageRef);
      return {
        url: downloadUrl,
        storagePath,
      };
    }

    const downloadUrl = await getDownloadURL(storageRef);
    return { url: downloadUrl, storagePath };
  }

  // Sandbox fallback when Firebase is not yet configured
  const objectUrl = URL.createObjectURL(file);
  return {
    url: objectUrl,
    storagePath,
  };
}
