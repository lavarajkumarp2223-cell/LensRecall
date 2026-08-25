import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { DB_TOKEN } from '../../database/database.module.js';
import type { Database } from '@lensrecall/db';
import {
  photos,
  photoFaces,
  events,
  processingJobs,
  auditLogs,
} from '@lensrecall/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { StorageService } from '../../providers/storage/storage.service.js';
import { FaceRecognitionService } from '../../providers/face-recognition/face-recognition.service.js';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_NAMES } from '@lensrecall/shared';

@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);
  private readonly imageProcessingQueue: Queue;

  constructor(
    @Inject(DB_TOKEN) private readonly db: Database,
    private readonly storageService: StorageService,
    private readonly faceRecognitionService: FaceRecognitionService,
  ) {
    const connection = new IORedis(
      process.env['REDIS_URL'] ?? 'redis://localhost:6379',
      { maxRetriesPerRequest: null },
    );
    this.imageProcessingQueue = new Queue(QUEUE_NAMES.IMAGE_PROCESSING, {
      connection,
    });
  }

  async listEventPhotos(
    eventId: string,
    organizationId: string,
    options?: {
      albumId?: string;
      status?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = options?.limit ?? 40;
    const offset = options?.offset ?? 0;

    let conditions = eq(photos.eventId, eventId);
    if (options?.albumId) {
      conditions = and(conditions, eq(photos.albumId, options.albumId))!;
    }
    if (options?.status) {
      conditions = and(conditions, eq(photos.processingStatus, options.status as any))!;
    }

    const photoList = await this.db.query.photos.findMany({
      where: conditions,
      limit,
      offset,
      orderBy: [desc(photos.createdAt)],
      with: {
        faces: {
          columns: {
            id: true,
            qualityScore: true,
            detectionConfidence: true,
            boundingBoxLeft: true,
            boundingBoxTop: true,
            boundingBoxWidth: true,
            boundingBoxHeight: true,
          },
        },
      },
    });

    // Generate ephemeral signed URLs for thumbnails & previews
    const results = await Promise.all(
      photoList.map(async (p) => {
        let thumbnailUrl = '';
        let previewUrl = '';

        try {
          if (p.thumbnailStorageKey) {
            thumbnailUrl = await this.storageService.generateDownloadUrl(
              p.thumbnailStorageKey,
              3600,
            );
          } else {
            thumbnailUrl = await this.storageService.generateDownloadUrl(
              p.storageKey,
              3600,
            );
          }

          if (p.previewStorageKey) {
            previewUrl = await this.storageService.generateDownloadUrl(
              p.previewStorageKey,
              3600,
            );
          }
        } catch (err) {
          this.logger.warn(`Could not sign URLs for photo ${p.id}: ${err}`);
        }

        return {
          id: p.id,
          eventId: p.eventId,
          albumId: p.albumId,
          originalFilename: p.originalFilename,
          width: p.width,
          height: p.height,
          fileSizeBytes: p.fileSizeBytes,
          mimeType: p.mimeType,
          processingStatus: p.processingStatus,
          createdAt: p.createdAt,
          thumbnailUrl,
          previewUrl,
          faceCount: p.faces?.length ?? 0,
          faces: p.faces,
        };
      }),
    );

    const [totalCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(photos)
      .where(conditions);

    return {
      total: Number(totalCount?.count ?? 0),
      items: results,
    };
  }

  async getPhotoDetails(photoId: string) {
    const photo = await this.db.query.photos.findFirst({
      where: eq(photos.id, photoId),
      with: {
        faces: true,
        album: true,
      },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    const downloadUrl = await this.storageService.generateDownloadUrl(
      photo.storageKey,
      3600,
    );

    let previewUrl = downloadUrl;
    if (photo.previewStorageKey) {
      previewUrl = await this.storageService.generateDownloadUrl(
        photo.previewStorageKey,
        3600,
      );
    }

    return {
      ...photo,
      downloadUrl,
      previewUrl,
      faceCount: photo.faces.length,
    };
  }

  async deletePhoto(photoId: string, userId: string) {
    const photo = await this.db.query.photos.findFirst({
      where: eq(photos.id, photoId),
      with: {
        faces: true,
        event: true,
      },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    // 1. Delete faces from AWS Rekognition collection
    const externalFaceIds = photo.faces
      .map((f) => f.externalFaceId)
      .filter((id): id is string => Boolean(id));

    if (externalFaceIds.length > 0) {
      for (const faceId of externalFaceIds) {
        try {
          await this.faceRecognitionService.deleteFace(
            `lensrecall_${photo.eventId}`,
            faceId,
          );
        } catch (err) {
          this.logger.warn(`Could not delete face ${faceId} from Rekognition: ${err}`);
        }
      }
    }

    // 2. Delete storage files
    const keysToDelete = [
      photo.storageKey,
      photo.thumbnailStorageKey,
      photo.previewStorageKey,
    ].filter((k): k is string => Boolean(k));

    await this.storageService.deleteObjects(keysToDelete);

    // 3. Delete from DB
    await this.db.delete(photos).where(eq(photos.id, photoId));

    // 4. Audit log
    await this.db.insert(auditLogs).values({
      organizationId: photo.event?.organizationId ?? null,
      userId,
      action: 'PHOTO_DELETED',
      entityType: 'photo',
      entityId: photoId,
    });

    return { message: 'Photo and biometric representations deleted' };
  }

  async retryProcessing(photoId: string) {
    const photo = await this.db.query.photos.findFirst({
      where: eq(photos.id, photoId),
      with: { event: true },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    await this.db
      .update(photos)
      .set({
        processingStatus: 'UPLOADED',
        processingError: null,
        updatedAt: new Date(),
      })
      .where(eq(photos.id, photoId));

    await this.imageProcessingQueue.add(
      'retry-optimize-image',
      {
        photoId: photo.id,
        eventId: photo.eventId,
        organizationId: photo.event?.organizationId ?? '',
        storageKey: photo.storageKey,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    return { message: 'Processing job re-enqueued' };
  }
}
