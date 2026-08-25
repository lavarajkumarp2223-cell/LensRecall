import {
  Injectable,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DB_TOKEN } from '../../database/database.module.js';
import type { Database } from '@lensrecall/db';
import {
  photos,
  events,
  processingJobs,
  auditLogs,
} from '@lensrecall/db';
import { eq, and } from 'drizzle-orm';
import {
  PresignedUploadUrlRequestSchema,
  ConfirmUploadBatchSchema,
  STORAGE_KEYS,
  IMAGE_LIMITS,
} from '@lensrecall/shared';
import { StorageService } from '../../providers/storage/storage.service.js';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_NAMES } from '@lensrecall/shared';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly imageProcessingQueue: Queue;

  constructor(
    @Inject(DB_TOKEN) private readonly db: Database,
    private readonly storageService: StorageService,
  ) {
    const connection = new IORedis(
      process.env['REDIS_URL'] ?? 'redis://localhost:6379',
      { maxRetriesPerRequest: null },
    );
    this.imageProcessingQueue = new Queue(QUEUE_NAMES.IMAGE_PROCESSING, {
      connection,
    });
  }

  async getPresignedUrls(
    userId: string,
    organizationId: string,
    eventId: string,
    data: typeof PresignedUploadUrlRequestSchema._type,
  ) {
    // 1. Verify event permissions
    await this.assertCanUpload(eventId, organizationId);

    // 2. Generate presigned URLs for each file
    const uploadItems = await Promise.all(
      data.files.map(async (file: any) => {
        const photoId = randomUUID();
        const extension = file.filename.split('.').pop()?.toLowerCase() || 'jpg';
        const storageKey = STORAGE_KEYS.photoOriginal(
          eventId,
          photoId,
        );

        const signedUrl = await this.storageService.generateUploadUrl(
          storageKey,
          {
            contentType: file.mimeType || 'image/jpeg',
            maxSizeBytes: file.sizeBytes || IMAGE_LIMITS.MAX_FILE_SIZE_BYTES,
            expiresInSeconds: 3600,
            metadata: {
              photoId,
              eventId,
              albumId: file.albumId ?? '',
              uploadedBy: userId,
            },
          },
        );

        return {
          photoId,
          filename: file.filename,
          storageKey,
          uploadUrl: signedUrl.uploadUrl,
          expiresAt: signedUrl.expiresAt,
        };
      }),
    );

    return {
      eventId,
      items: uploadItems,
    };
  }

  async confirmUploadBatch(
    userId: string,
    organizationId: string,
    eventId: string,
    data: any,
  ) {
    await this.assertCanUpload(eventId, organizationId);

    return await this.db.transaction(async (tx) => {
      const createdPhotos = [];
      const queueJobs = [];
      const uploadsList = data.uploads || data.items || [];

      for (const item of uploadsList) {
        // Insert Photo Record
        const [photo] = await tx
          .insert(photos)
          .values({
            id: item.photoId || randomUUID(),
            eventId,
            albumId: item.albumId ?? null,
            uploadedBy: userId,
            originalFilename: item.originalFilename || item.filename || 'photo.jpg',
            storageKey: item.storageKey || STORAGE_KEYS.photoOriginal(eventId, item.photoId || randomUUID()),
            fileSize: item.fileSize || item.sizeBytes || 1024,
            mimeType: item.mimeType || 'image/jpeg',
            checksum: item.checksum || randomUUID().replace(/-/g, ''),
            processingStatus: 'UPLOADED',
          })
          .returning();

        if (photo) {
          createdPhotos.push(photo);

          // Insert Processing Job Record
          const [job] = await tx
            .insert(processingJobs)
            .values({
              photoId: photo.id,
              eventId,
              jobType: 'IMAGE_PROCESSING',
              status: 'QUEUED',
            })
            .returning();

          queueJobs.push({
            name: 'optimize-image',
            data: {
              photoId: photo.id,
              eventId,
              organizationId,
              storageKey: photo.storageKey,
            },
            opts: {
              jobId: job?.id || photo.id,
              attempts: 3,
              backoff: { type: 'exponential' as const, delay: 5000 },
            },
          });
        }
      }

      // Enqueue bulk jobs into Redis
      if (queueJobs.length > 0) {
        try {
          await this.imageProcessingQueue.addBulk(queueJobs);
          this.logger.log(
            `Enqueued ${queueJobs.length} photo processing jobs for event ${eventId}`,
          );
        } catch {
          this.logger.warn('Redis queue offline — stored in Postgres processing_jobs');
        }
      }

      // Audit log
      await tx.insert(auditLogs).values({
        organizationId,
        actorId: userId,
        eventId,
        action: 'PHOTOS_UPLOADED',
        resourceType: 'event',
        resourceId: eventId,
        metadata: { photoCount: createdPhotos.length },
      });

      return {
        success: true,
        enqueuedCount: createdPhotos.length,
        photos: createdPhotos.map((p) => ({
          id: p.id,
          filename: p.originalFilename,
          status: p.processingStatus,
        })),
      };
    });
  }

  // ─── Security Assertion ──────────────────────────────────────────────────

  private async assertCanUpload(
    eventId: string,
    organizationId: string,
  ) {
    const event = await this.db.query.events.findFirst({
      where: and(eq(events.id, eventId), eq(events.organizationId, organizationId)),
    });

    if (!event) {
      throw new BadRequestException('Event not found or access denied');
    }

    if (event.status === 'ARCHIVED') {
      throw new BadRequestException(
        `Cannot upload photos to ${event.status.toLowerCase()} event`,
      );
    }

    return event;
  }
}
