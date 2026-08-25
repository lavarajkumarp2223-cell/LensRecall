import { Injectable, Logger } from '@nestjs/common';
import { StorageService, UploadOptions, SignedUploadUrl, StorageObject } from './storage.service.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

/**
 * MockStorageAdapter — Development-only in-memory/filesystem storage.
 *
 * ⚠️  THIS IS NEVER FOR PRODUCTION USE ⚠️
 *
 * Files are stored in a local temp directory.
 * "Signed URLs" are just local file server URLs (api /dev/storage/:key).
 *
 * The production environment REQUIRES a real storage adapter.
 * If NODE_ENV=production and STORAGE_PROVIDER=mock, the app will throw on startup.
 */
@Injectable()
export class MockStorageAdapter extends StorageService {
  private readonly logger = new Logger(MockStorageAdapter.name);
  private readonly baseDir: string;

  constructor() {
    super();

    if (process.env['NODE_ENV'] === 'production') {
      throw new Error(
        '🚨 CRITICAL: MockStorageAdapter cannot be used in production. ' +
          'Set STORAGE_PROVIDER=r2 or STORAGE_PROVIDER=s3 and configure credentials.',
      );
    }

    this.baseDir = path.join(os.tmpdir(), 'lensrecall-dev-storage');
    this.logger.warn(
      '⚠️  MockStorageAdapter is active — using local filesystem. ' +
        'This is DEVELOPMENT ONLY. Set STORAGE_PROVIDER=r2 for production.',
    );
  }

  async generateUploadUrl(key: string, _options: UploadOptions): Promise<SignedUploadUrl> {
    // In dev, we'll accept uploads via a special dev endpoint
    const uploadUrl = `http://localhost:${process.env['API_PORT'] ?? '3001'}/dev/storage/upload?key=${encodeURIComponent(key)}`;
    return {
      uploadUrl,
      key,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
  }

  async generateDownloadUrl(key: string, _ttlSeconds: number): Promise<string> {
    return `http://localhost:${process.env['API_PORT'] ?? '3001'}/dev/storage/download?key=${encodeURIComponent(key)}`;
  }

  async deleteObject(key: string): Promise<void> {
    const filePath = this.keyToPath(key);
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore — file may not exist
    }
  }

  async deleteObjects(keys: string[]): Promise<void> {
    await Promise.allSettled(keys.map((k) => this.deleteObject(k)));
  }

  async copyObject(sourceKey: string, destKey: string): Promise<void> {
    const src = this.keyToPath(sourceKey);
    const dest = this.keyToPath(destKey);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }

  async objectExists(key: string): Promise<boolean> {
    try {
      await fs.access(this.keyToPath(key));
      return true;
    } catch {
      return false;
    }
  }

  async getObjectMetadata(key: string): Promise<StorageObject | null> {
    try {
      const stat = await fs.stat(this.keyToPath(key));
      return {
        key,
        sizeBytes: stat.size,
        contentType: 'image/jpeg',
        lastModified: stat.mtime,
      };
    } catch {
      return null;
    }
  }

  async uploadBuffer(
    key: string,
    buffer: Buffer,
    _options: { contentType: string; metadata?: Record<string, string> },
  ): Promise<void> {
    const filePath = this.keyToPath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    this.logger.debug(`[MOCK] Saved ${buffer.length} bytes to: ${filePath}`);
  }

  async downloadBuffer(key: string): Promise<Buffer> {
    return fs.readFile(this.keyToPath(key));
  }

  private keyToPath(key: string): string {
    return path.join(this.baseDir, key.replace(/\//g, path.sep));
  }
}
