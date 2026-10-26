import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

export class StorageService {
  private supabase: SupabaseClient | null = null;
  private bucketName: string;

  constructor() {
    this.bucketName = config.SUPABASE_STORAGE_BUCKET || 'complaint-evidence';
    if (config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)) {
      try {
        const key = config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY!;
        this.supabase = createClient(config.SUPABASE_URL, key);
      } catch (err) {
        console.warn('⚠️ Could not initialize Supabase Storage client:', err);
      }
    }
  }

  /**
   * Uploads evidence photo to Supabase Private Storage Bucket and generates a signed URL
   */
  async uploadEvidence(params: {
    userId: string;
    complaintId: string;
    fileBuffer: Buffer;
    mimeType: string;
    fileExtension: string;
    isResolutionProof?: boolean;
  }): Promise<{ storagePath: string; signedUrl: string }> {
    const { userId, complaintId, fileBuffer, mimeType, fileExtension, isResolutionProof = false } = params;
    const prefix = isResolutionProof ? 'resolution' : 'evidence';
    const filePath = `${userId}/${complaintId}/${prefix}_${Date.now()}.${fileExtension}`;

    if (this.supabase) {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: true
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw new Error(`Failed to upload evidence to private storage: ${error.message}`);
      }

      // Generate signed URL valid for 24 hours (86400 seconds)
      const { data: signedData, error: signError } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(data.path, 86400);

      if (signError || !signedData?.signedUrl) {
        console.warn('Could not generate signed URL:', signError);
        return { storagePath: data.path, signedUrl: '' };
      }

      return { storagePath: data.path, signedUrl: signedData.signedUrl };
    }

    // In local / offline mode, return path
    return {
      storagePath: `local://storage/${filePath}`,
      signedUrl: `data:${mimeType};base64,${fileBuffer.toString('base64')}`
    };
  }

  /**
   * Generates a short-lived signed URL for an existing private evidence path
   */
  async getSignedUrl(storagePath: string, expiresInSeconds: number = 3600): Promise<string> {
    if (!this.supabase || storagePath.startsWith('data:') || storagePath.startsWith('local://')) {
      return storagePath;
    }

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.warn('Failed to generate signed URL for path:', storagePath, error);
      return storagePath;
    }

    return data.signedUrl;
  }
}

export const storageService = new StorageService();
