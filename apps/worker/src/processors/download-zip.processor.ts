import type { Job } from 'bullmq';
import archiver from 'archiver';
import { PassThrough } from 'node:stream';
import type { DownloadZipJobData } from '@lensrecall/shared';
import { STORAGE_KEYS } from '@lensrecall/shared';
import { db, downloadJobs, photos } from '@lensrecall/db';
import { eq, inArray } from 'drizzle-orm';
import { getStorageService } from '../services/storage.factory.js';

const storageService = getStorageService();

export async function downloadZipProcessor(job: Job<DownloadZipJobData>): Promise<void> {
  const { downloadJobId, userId, eventId, photoIds } = job.data;

  console.log(`[DownloadZip] Creating ZIP for ${photoIds.length} photos (job: ${downloadJobId})`);

  await db
    .update(downloadJobs)
    .set({ status: 'PROCESSING' })
    .where(eq(downloadJobs.id, downloadJobId));

  // Verify all photos belong to this event (authorization check in worker)
  const photosToDownload = await db.query.photos.findMany({
    where: inArray(photos.id, photoIds),
    columns: { id: true, eventId: true, storageKey: true, originalFilename: true },
  });

  // Filter to only photos in this event — extra safety
  const authorizedPhotos = photosToDownload.filter((p) => p.eventId === eventId);

  if (authorizedPhotos.length === 0) {
    await db
      .update(downloadJobs)
      .set({ status: 'FAILED' })
      .where(eq(downloadJobs.id, downloadJobId));
    throw new Error(`No authorized photos found for download job ${downloadJobId}`);
  }

  // Create ZIP in memory
  const archive = archiver('zip', { zlib: { level: 6 } });
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('error', reject);
    archive.on('end', () => resolve());

    // Add each photo to the ZIP
    const addPhotos = async () => {
      for (const photo of authorizedPhotos) {
        try {
          const buffer = await storageService.downloadBuffer(photo.storageKey);
          archive.append(buffer, { name: photo.originalFilename });
        } catch (err) {
          console.warn(`[DownloadZip] Could not add photo ${photo.id}:`, err);
        }
      }
      archive.finalize();
    };

    void addPhotos().catch(reject);
  });

  const zipBuffer = Buffer.concat(chunks);
  const zipKey = STORAGE_KEYS.downloadZip(downloadJobId);

  // Upload ZIP to storage
  await storageService.uploadBuffer(zipKey, zipBuffer, {
    contentType: 'application/zip',
    metadata: { downloadJobId, userId, eventId, photoCount: authorizedPhotos.length.toString() },
  });

  // Generate signed download URL (24 hour expiry)
  const expiryHours = parseInt(process.env['DEFAULT_DOWNLOAD_ZIP_EXPIRY_HOURS'] ?? '24', 10);
  const downloadUrl = await storageService.generateDownloadUrl(zipKey, expiryHours * 3600);
  const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000);

  // Update job record
  await db
    .update(downloadJobs)
    .set({
      status: 'READY',
      zipStorageKey: zipKey,
      downloadUrl,
      expiresAt,
      completedAt: new Date(),
    })
    .where(eq(downloadJobs.id, downloadJobId));

  console.log(`[DownloadZip] ✓ ZIP ready for job ${downloadJobId} (${(zipBuffer.length / 1024 / 1024).toFixed(1)} MB)`);
}
