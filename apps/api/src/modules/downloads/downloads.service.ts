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
  downloadJobs,
  photos,
  events,
  auditLogs,
} from '@lensrecall/db';
import { eq, and, inArray } from 'drizzle-orm';
import { StorageService } from '../../providers/storage/storage.service.js';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_NAMES, RequestZipDownloadSchema } from '@lensrecall/shared';

@Injectable()
export class DownloadsService {
  private readonly logger = new Logger(DownloadsService.name);
  private readonly downloadZipQueue: Queue;

  constructor(
    @Inject(DB_TOKEN) private readonly db: Database,
    private readonly storageService: StorageService,
  ) {
    const connection = new IORedis(
      process.env['REDIS_URL'] ?? 'redis://localhost:6379',
      { maxRetriesPerRequest: null },
    );
    this.downloadZipQueue = new Queue(QUEUE_NAMES.DOWNLOAD_ZIP, {
      connection,
    });
  }

  async getSinglePhotoDownloadUrl(photoId: string, userId?: string) {
    const photo = await this.db.query.photos.findFirst({
      where: eq(photos.id, photoId),
      with: { event: true },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    if (photo.event?.allowGuestDownloads === false) {
      throw new BadRequestException('Organizer has restricted full-resolution photo downloads for this event');
    }

    // Generate signed download URL (valid 2 hours)
    const downloadUrl = await this.storageService.generateDownloadUrl(
      photo.storageKey,
      7200,
    );

    // Audit log
    await this.db.insert(auditLogs).values({
      organizationId: photo.event?.organizationId ?? null,
      userId: userId ?? null,
      action: 'PHOTO_DOWNLOADED',
      entityType: 'photo',
      entityId: photoId,
      metadata: { filename: photo.originalFilename },
    });

    return {
      downloadUrl,
      filename: photo.originalFilename,
    };
  }

  async requestZipDownload(
    userId: string,
    data: typeof RequestZipDownloadSchema._type,
  ) {
    const event = await this.db.query.events.findFirst({
      where: eq(events.id, data.eventId),
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.allowGuestDownloads === false) {
      throw new BadRequestException('Organizer has restricted bulk photo downloads for this event');
    }

    // Verify photos belong to event
    const validPhotos = await this.db.query.photos.findMany({
      where: and(
        eq(photos.eventId, data.eventId),
        inArray(photos.id, data.photoIds),
      ),
      columns: { id: true },
    });

    if (validPhotos.length === 0) {
      throw new BadRequestException('No valid photos selected for download');
    }

    // 1. Create download job record in DB
    const [jobRecord] = await this.db
      .insert(downloadJobs)
      .values({
        eventId: data.eventId,
        userId,
        photoCount: validPhotos.length,
        status: 'QUEUED',
      })
      .returning();

    if (!jobRecord) {
      throw new BadRequestException('Failed to create download job');
    }

    // 2. Enqueue BullMQ ZIP worker task
    await this.downloadZipQueue.add(
      'create-download-zip',
      {
        downloadJobId: jobRecord.id,
        userId,
        eventId: data.eventId,
        photoIds: validPhotos.map((p) => p.id),
      },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 3000 },
      },
    );

    this.logger.log(
      `Enqueued ZIP download job ${jobRecord.id} for ${validPhotos.length} photos`,
    );

    return {
      jobId: jobRecord.id,
      status: jobRecord.status,
      photoCount: validPhotos.length,
    };
  }

  async getDownloadJobStatus(jobId: string) {
    const job = await this.db.query.downloadJobs.findFirst({
      where: eq(downloadJobs.id, jobId),
    });

    if (!job) {
      throw new NotFoundException('Download job not found');
    }

    return {
      id: job.id,
      status: job.status,
      photoCount: job.photoCount,
      downloadUrl: job.downloadUrl,
      expiresAt: job.expiresAt,
      completedAt: job.completedAt,
    };
  }
}
