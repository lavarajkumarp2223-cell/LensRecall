import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service.js';
import { R2StorageAdapter } from './r2.adapter.js';
import { MockStorageAdapter } from './mock.adapter.js';

/**
 * StorageProviderModule — Selects and provides the correct StorageService
 * based on the STORAGE_PROVIDER environment variable.
 *
 * STORAGE_PROVIDER=r2     → R2StorageAdapter (Cloudflare R2)
 * STORAGE_PROVIDER=s3     → S3StorageAdapter (AWS S3, future)
 * STORAGE_PROVIDER=mock   → MockStorageAdapter (dev only)
 *
 * The module exports StorageService so all other modules receive
 * the correct adapter via dependency injection without caring which one.
 */
@Global()
@Module({
  providers: [
    {
      provide: StorageService,
      useFactory: (): StorageService => {
        const provider = process.env['STORAGE_PROVIDER'] ?? 'mock';

        switch (provider) {
          case 'r2':
            return new R2StorageAdapter();
          case 'mock':
            return new MockStorageAdapter();
          default:
            throw new Error(
              `Unknown STORAGE_PROVIDER: "${provider}". ` +
                'Valid options: r2, s3, mock',
            );
        }
      },
    },
  ],
  exports: [StorageService],
})
export class StorageProviderModule {}
