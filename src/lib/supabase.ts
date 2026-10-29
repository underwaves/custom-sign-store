// Re-exporting storage upload helpers backed by Firebase
export {
  uploadFileToBucket,
  validateUploadFile,
  isFirebaseConfigured as isSupabaseConfigured,
} from './firebase';
export type { StorageBucketName } from './firebase';

export const supabase = null;
