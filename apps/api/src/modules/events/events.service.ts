import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { DB_TOKEN } from '../../database/database.module.js';
import type { Database } from '@lensrecall/db';
import {
  events,
  eventPhotographers,
  albums,
  photos,
  qrCodes,
  organizationMembers,
  auditLogs,
} from '@lensrecall/db';
import { eq, and, sql, desc, ilike } from 'drizzle-orm';
import {
  CreateEventSchema,
  UpdateEventSchema,
  EventStatus,
} from '@lensrecall/shared';
import { FaceRecognitionService } from '../../providers/face-recognition/face-recognition.service.js';
import { NotificationService } from '../../providers/notifications/notification.service.js';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: Database,
    private readonly faceRecognitionService: FaceRecognitionService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    organizationId: string,
    userId: string,
    data: typeof CreateEventSchema._type,
  ) {
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + `-${randomBytes(3).toString('hex')}`;

    const existing = await this.db.query.events.findFirst({
      where: eq(events.slug, slug),
    });

    if (existing) {
      throw new ConflictException('An event with this slug already exists');
    }

    return await this.db.transaction(async (tx) => {
      // 1. Create the event
      const [event] = await tx
        .insert(events)
        .values({
          organizationId,
          name: data.name,
          slug,
          description: data.description,
          eventDate: data.eventDate ? new Date(data.eventDate) : new Date(),
          location: data.location,
          coverPhotoUrl: data.coverPhotoUrl,
          status: 'ACTIVE',
          faceRetentionDays: data.faceRetentionDays ?? 90,
          photoRetentionDays: data.photoRetentionDays ?? 365,
          requireGuestAuth: data.requireGuestAuth ?? true,
          allowGuestDownloads: data.allowGuestDownloads ?? true,
          watermarkEnabled: data.watermarkEnabled ?? false,
          watermarkText: data.watermarkText,
        })
        .returning();

      if (!event) {
        throw new BadRequestException('Failed to create event');
      }

      // 2. Automatically generate default QR code token
      const qrToken = randomBytes(16).toString('hex');
      await tx.insert(qrCodes).values({
        eventId: event.id,
        token: qrToken,
        label: 'Default Event QR',
        isActive: true,
      });

      // 3. Create default general album
      await tx.insert(albums).values({
        eventId: event.id,
        name: 'Highlights & All Photos',
        description: 'Default collection for all event photographs',
        isDefault: true,
      });

      // 4. Assign creator as photographer/manager
      await tx.insert(eventPhotographers).values({
        eventId: event.id,
        userId,
        canUpload: true,
        canDelete: true,
      });

      // 5. Initialize AWS Rekognition Collection partition for event-scoped search
      const collectionId = `lensrecall_${event.id}`;
      try {
        await this.faceRecognitionService.createEventCollection(collectionId);
        this.logger.log(`Provisioned Rekognition collection: ${collectionId}`);
      } catch (err) {
        this.logger.warn(`Could not provision Rekognition collection: ${err}`);
      }

      // 6. Audit log
      await tx.insert(auditLogs).values({
        organizationId,
        userId,
        action: 'EVENT_CREATED',
        entityType: 'event',
        entityId: event.id,
        metadata: { name: event.name, slug: event.slug },
      });

      return { ...event, qrToken };
    });
  }

  async list(
    organizationId: string,
    options?: {
      search?: string;
      status?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    let whereClause = eq(events.organizationId, organizationId);

    const eventList = await this.db.query.events.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(events.createdAt)],
      with: {
        qrCodes: {
          limit: 1,
        },
      },
    });

    // Decorate with counts
    const eventIds = eventList.map((e) => e.id);
    if (eventIds.length === 0) return [];

    return eventList.map((e) => ({
      ...e,
      qrToken: e.qrCodes[0]?.token,
    }));
  }

  async getById(eventId: string, organizationId: string) {
    const event = await this.db.query.events.findFirst({
      where: and(eq(events.id, eventId), eq(events.organizationId, organizationId)),
      with: {
        albums: true,
        qrCodes: true,
        photographers: {
          with: {
            user: {
              columns: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Photo count
    const [photoStats] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(photos)
      .where(eq(photos.eventId, eventId));

    return {
      ...event,
      photoCount: Number(photoStats?.count ?? 0),
    };
  }

  async update(
    eventId: string,
    organizationId: string,
    userId: string,
    data: typeof UpdateEventSchema._type,
  ) {
    const [updated] = await this.db
      .update(events)
      .set({
        ...data,
        eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(events.id, eventId), eq(events.organizationId, organizationId)))
      .returning();

    if (!updated) {
      throw new NotFoundException('Event not found');
    }

    await this.db.insert(auditLogs).values({
      organizationId,
      userId,
      action: 'EVENT_UPDATED',
      entityType: 'event',
      entityId: eventId,
      metadata: data,
    });

    return updated;
  }

  async delete(eventId: string, organizationId: string, userId: string) {
    const event = await this.db.query.events.findFirst({
      where: and(eq(events.id, eventId), eq(events.organizationId, organizationId)),
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // 1. Delete Rekognition collection
    try {
      await this.faceRecognitionService.deleteEventCollection(`lensrecall_${eventId}`);
    } catch (err) {
      this.logger.warn(`Could not delete Rekognition collection: ${err}`);
    }

    // 2. Cascade delete event from DB
    await this.db.delete(events).where(eq(events.id, eventId));

    // 3. Audit log
    await this.db.insert(auditLogs).values({
      organizationId,
      userId,
      action: 'EVENT_DELETED',
      entityType: 'event',
      entityId: eventId,
    });

    return { message: 'Event and associated biometric collections deleted' };
  }

  async addPhotographer(
    eventId: string,
    organizationId: string,
    targetUserId: string,
    options?: { canUpload?: boolean; canDelete?: boolean },
  ) {
    // Verify event belongs to org
    const event = await this.db.query.events.findFirst({
      where: and(eq(events.id, eventId), eq(events.organizationId, organizationId)),
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const [assignment] = await this.db
      .insert(eventPhotographers)
      .values({
        eventId,
        userId: targetUserId,
        canUpload: options?.canUpload ?? true,
        canDelete: options?.canDelete ?? false,
      })
      .onConflictDoNothing()
      .returning();

    return assignment || { message: 'Photographer already assigned' };
  }

  async removePhotographer(
    eventId: string,
    organizationId: string,
    targetUserId: string,
  ) {
    await this.db
      .delete(eventPhotographers)
      .where(
        and(
          eq(eventPhotographers.eventId, eventId),
          eq(eventPhotographers.userId, targetUserId),
        ),
      );

    return { message: 'Photographer removed from event' };
  }
}
