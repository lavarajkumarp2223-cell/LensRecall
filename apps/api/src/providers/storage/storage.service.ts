/**
 * StorageService — Abstract interface for object storage.
 *
 * Concrete adapters:
 * - R2StorageAdapter (Cloudflare R2, S3-compatible)
 * - S3StorageAdapter (AWS S3)
 * - MockStorageAdapter (development only)
 *
 * RULES:
 * - Storage keys are NEVER exposed to API clients
 * - All client access to stored files goes through signed URLs
 * - Signed URLs must have a TTL and expire
 * - Upload URLs must be single-use (enforced by provider)
 */
export interface UploadOptions {
  contentType: string;
  maxSizeBytes: number;
  metadata?: Record<string, string> | undefined;
  expiresInSeconds?: number | undefined;
}

export interface SignedUploadUrl {
  uploadUrl: string;      // PUT this URL directly (presigned)
  key: string;            // the storage key — store in DB, never expose
  expiresAt: Date;
}

export interface StorageObject {
  key: string;
  sizeBytes: number;
  contentType: string;
  lastModified: Date;
  metadata?: Record<string, string> | undefined;
}

export abstract class StorageService {
  /**
   * Generate a presigned URL for direct client upload.
   * The client PUTs the file directly to this URL without going through the API server.
   */
  abstract generateUploadUrl(key: string, options: UploadOptions): Promise<SignedUploadUrl>;

  /**
   * Generate a presigned URL for reading a stored object.
   * @param ttlSeconds - how long the URL should be valid (max 7 days for most providers)
   */
  abstract generateDownloadUrl(key: string, ttlSeconds: number): Promise<string>;

  /**
   * Delete an object from storage.
   */
  abstract deleteObject(key: string): Promise<void>;

  /**
   * Delete multiple objects in bulk.
   */
  abstract deleteObjects(keys: string[]): Promise<void>;

  /**
   * Copy an object within the same bucket.
   */
  abstract copyObject(sourceKey: string, destKey: string): Promise<void>;

  /**
   * Check if an object exists.
   */
  abstract objectExists(key: string): Promise<boolean>;

  /**
   * Get object metadata without downloading content.
   */
  abstract getObjectMetadata(key: string): Promise<StorageObject | null>;

  /**
   * Upload a buffer directly (used by workers for thumbnails/previews).
   * Direct upload from server — not presigned URL.
   */
  abstract uploadBuffer(
    key: string,
    buffer: Buffer,
    options: { contentType: string; metadata?: Record<string, string> },
  ): Promise<void>;

  /**
   * Download an object as a Buffer (used by workers for image processing).
   * Only used server-side — never stream to API response directly.
   */
  abstract downloadBuffer(key: string): Promise<Buffer>;
}
