import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { DB_TOKEN } from '../../database/database.module.js';
import type { Database } from '@lensrecall/db';
import {
  events,
  qrCodes,
  photos,
  photoFaces,
  auditLogs,
} from '@lensrecall/db';
import { eq, and, inArray } from 'drizzle-orm';
import { FaceRecognitionService } from '../../providers/face-recognition/face-recognition.service.js';
import { StorageService } from '../../providers/storage/storage.service.js';

@Injectable()
export class FaceDetectionService {
  private readonly logger = new Logger(FaceDetectionService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: Database,
    private readonly faceRecognitionService: FaceRecognitionService,
    private readonly storageService: StorageService,
  ) {}

  async searchGuestFacesByImage(
    qrToken: string,
    imageBuffer: Buffer,
    userId?: string,
  ) {
    // 1. Resolve QR token to Event
    const qr = await this.db.query.qrCodes.findFirst({
      where: and(eq(qrCodes.token, qrToken), eq(qrCodes.status, 'ACTIVE')),
      with: { event: true },
    });

    if (!qr || !qr.event) {
      throw new NotFoundException('Invalid or expired event QR code');
    }

    const event = qr.event;
    if (event.status !== 'ACTIVE') {
      throw new BadRequestException(`Event discovery is currently ${event.status.toLowerCase()}`);
    }

    // 2. Validate face quality in uploaded selfie
    const detectedFaces = await this.faceRecognitionService.detectFaces(imageBuffer);
    if (detectedFaces.length === 0) {
      throw new BadRequestException('No face detected in capture. Please ensure your face is clearly visible.');
    }

    const primaryFace = detectedFaces[0]!;
    const qualityResult = this.faceRecognitionService.validateFaceQuality(primaryFace);
    if (!qualityResult.isUsable) {
      throw new BadRequestException(
        `Face capture quality insufficient: ${qualityResult.reason || 'Please retake with better lighting'}.`,
      );
    }

    // 3. Search AWS Rekognition collection for this event partition
    const eventCollectionId = `lensrecall_${event.id}`;
    const matches = await this.faceRecognitionService.searchFaces(
      imageBuffer,
      eventCollectionId,
      { minSimilarity: 80, maxResults: 100 },
    );

    if (matches.length === 0) {
      // Log search attempt
      await this.logSearchAudit(event.id, event.organizationId, userId, 0);

      return {
        eventId: event.id,
        eventName: event.name,
        totalFound: 0,
        photos: [],
      };
    }

    // 4. Map externalFaceIds -> photo_faces -> photos
    const externalFaceIds = matches.map((m) => m.externalFaceId);

    const foundFaces = await this.db.query.photoFaces.findMany({
      where: inArray(photoFaces.externalFaceId, externalFaceIds),
      with: {
        photo: {
          with: {
            album: true,
          },
        },
      },
    });

    // 5. Deduplicate unique photos and attach similarity scores
    const photoMap = new Map<string, any>();

    for (const ff of foundFaces) {
      if (!ff.photo) continue;
      const photoId = ff.photo.id;

      // Find similarity score for this face
      const matchItem = matches.find((m) => m.externalFaceId === ff.externalFaceId);
      const similarity = matchItem ? Math.round(matchItem.similarityScore * 100) : 95;

      if (!photoMap.has(photoId)) {
        photoMap.set(photoId, {
          photo: ff.photo,
          bestSimilarity: similarity,
          matchedFaceBoundingBox: {
            left: parseFloat(ff.boundingBoxLeft),
            top: parseFloat(ff.boundingBoxTop),
            width: parseFloat(ff.boundingBoxWidth),
            height: parseFloat(ff.boundingBoxHeight),
          },
        });
      } else {
        const existing = photoMap.get(photoId);
        if (similarity > existing.bestSimilarity) {
          existing.bestSimilarity = similarity;
        }
      }
    }

    // 6. Generate signed URLs for discovered matching photos
    const results = await Promise.all(
      Array.from(photoMap.values()).map(async (item) => {
        const p = item.photo;
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
          this.logger.warn(`Could not sign download URL for match ${p.id}: ${err}`);
        }

        return {
          id: p.id,
          originalFilename: p.originalFilename,
          album: p.album?.name || 'Highlights',
          width: p.width,
          height: p.height,
          similarityScore: item.bestSimilarity,
          thumbnailUrl,
          previewUrl,
          matchedFaceBoundingBox: item.matchedFaceBoundingBox,
          createdAt: p.createdAt,
        };
      }),
    );

    // Sort by best match score descending
    results.sort((a, b) => b.similarityScore - a.similarityScore);

    // 7. Record guest recall session and audit log
    await this.logSearchAudit(event.id, event.organizationId, userId, results.length);

    return {
      eventId: event.id,
      eventName: event.name,
      totalFound: results.length,
      photos: results,
    };
  }

  private async logSearchAudit(
    eventId: string,
    organizationId: string,
    userId?: string,
    foundCount: number = 0,
  ) {
    if (userId) {
      await this.db
        .insert(guestEvents)
        .values({
          eventId,
          userId,
          searchCount: 1,
          matchedPhotosCount: foundCount,
        })
        .onConflictDoNothing();
    }

    await this.db.insert(auditLogs).values({
      organizationId,
      userId: userId ?? null,
      action: 'FACE_SEARCH_PERFORMED',
      entityType: 'event',
      entityId: eventId,
      metadata: { matchesFound: foundCount },
    });
  }
}
