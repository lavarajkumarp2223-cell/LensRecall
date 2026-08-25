import type { Job } from 'bullmq';
import sharp from 'sharp';
import type { ImageProcessingJobData } from '@lensrecall/shared';
import { IMAGE_PROCESSING, STORAGE_KEYS, QUEUE_NAMES } from '@lensrecall/shared';
import { db, photos, processingJobs } from '@lensrecall/db';
import { eq } from 'drizzle-orm';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { getStorageService } from '../services/storage.factory.js';

const connection = new IORedis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const faceDetectionQueue = new Queue(QUEUE_NAMES.FACE_DETECTION, { connection });
const storageService = getStorageService();

export async function imageProcessingProcessor(job: Job<ImageProcessingJobData>): Promise<void> {
  const { photoId, eventId, storageKey } = job.data;

  console.log(`[ImageProcessor] Processing photo ${photoId}`);

  // Update status: PROCESSING
  await db
    .update(photos)
    .set({ processingStatus: 'PROCESSING', updatedAt: new Date() })
    .where(eq(photos.id, photoId));

  // Download original from storage
  const imageBuffer = await storageService.downloadBuffer(storageKey);

  // Get image metadata
  const metadata = await sharp(imageBuffer).metadata();
  const { width, height } = metadata;

  // Generate thumbnail
  const thumbnailBuffer = await sharp(imageBuffer)
    .resize(
      IMAGE_PROCESSING.THUMBNAIL_WIDTH,
      IMAGE_PROCESSING.THUMBNAIL_HEIGHT,
      { fit: 'cover', position: 'attention' }, // Smart cropping
    )
    .webp({ quality: 85 })
    .toBuffer();

  const thumbnailKey = STORAGE_KEYS.photoThumbnail(eventId, photoId);
  await storageService.uploadBuffer(thumbnailKey, thumbnailBuffer, {
    contentType: 'image/webp',
    metadata: { photoId, eventId, type: 'thumbnail' },
  });

  // Generate preview (large)
  const previewBuffer = await sharp(imageBuffer)
    .resize(IMAGE_PROCESSING.PREVIEW_MAX_WIDTH, undefined, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: IMAGE_PROCESSING.PREVIEW_QUALITY })
    .toBuffer();

  const previewKey = STORAGE_KEYS.photoPreview(eventId, photoId);
  await storageService.uploadBuffer(previewKey, previewBuffer, {
    contentType: 'image/webp',
    metadata: { photoId, eventId, type: 'preview' },
  });

  // Update photo record with dimensions and storage keys
  await db
    .update(photos)
    .set({
      width,
      height,
      thumbnailStorageKey: thumbnailKey,
      previewStorageKey: previewKey,
      processingStatus: 'FACE_DETECTION',
      updatedAt: new Date(),
    })
    .where(eq(photos.id, photoId));

  // Enqueue face detection job
  await faceDetectionQueue.add(
    'detect-faces',
    {
      photoId,
      eventId,
      organizationId: job.data.organizationId,
      storageKey,
    },
    {
      attempts: parseInt(process.env['QUEUE_MAX_ATTEMPTS'] ?? '3', 10),
      backoff: { type: 'exponential', delay: parseInt(process.env['QUEUE_BACKOFF_MS'] ?? '5000', 10) },
    },
  );

  console.log(`[ImageProcessor] ✓ Photo ${photoId} — thumbnail + preview generated, face detection queued`);
}
