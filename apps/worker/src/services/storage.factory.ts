/**
 * Worker-side storage factory.
 * Mirrors the NestJS StorageProviderModule selection logic,
 * but for the worker process which doesn't use NestJS DI.
 */
import { StorageService } from '../../../apps/api/src/providers/storage/storage.service.js';

let instance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (instance) return instance;

  const provider = process.env['STORAGE_PROVIDER'] ?? 'mock';

  // Dynamic import to avoid loading unused adapters
  switch (provider) {
    case 'r2': {
      const { R2StorageAdapter } = require('../../../apps/api/src/providers/storage/r2.adapter.js');
      instance = new R2StorageAdapter();
      break;
    }
    case 'mock': {
      const { MockStorageAdapter } = require('../../../apps/api/src/providers/storage/mock.adapter.js');
      instance = new MockStorageAdapter();
      break;
    }
    default:
      throw new Error(`Unknown STORAGE_PROVIDER: "${provider}"`);
  }

  return instance!;
}
