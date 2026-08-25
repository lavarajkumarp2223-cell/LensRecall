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
  privacyRequests,
  events,
  auditLogs,
  consents,
} from '@lensrecall/db';
import { eq, and, desc } from 'drizzle-orm';
import { FaceRecognitionService } from '../../providers/face-recognition/face-recognition.service.js';
import { CreatePrivacyRequestSchema } from '@lensrecall/shared';

@Injectable()
export class PrivacyService {
  private readonly logger = new Logger(PrivacyService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: Database,
    private readonly faceRecognitionService: FaceRecognitionService,
  ) {}

  async submitPrivacyRequest(
    userId: string,
    data: typeof CreatePrivacyRequestSchema._type,
    ipAddress?: string,
  ) {
    let orgId: string | null = null;
    if (data.eventId) {
      const event = await this.db.query.events.findFirst({
        where: eq(events.id, data.eventId),
      });
      if (event) orgId = event.organizationId;
    }

    const [created] = await this.db
      .insert(privacyRequests)
      .values({
        userId,
        eventId: data.eventId ?? null,
        requestType: data.requestType,
        notes: data.notes ?? null,
        status: 'PENDING',
      })
      .returning();

    // Log in audit log
    await this.db.insert(auditLogs).values({
      organizationId: orgId,
      actorId: userId,
      eventId: data.eventId ?? null,
      action: 'PRIVACY_REQUEST_SUBMITTED',
      resourceType: 'privacy_request',
      resourceId: created!.id,
      metadata: {
        requestType: data.requestType,
        ipAddress,
      },
    });

    return {
      success: true,
      requestId: created!.id,
      status: created!.status,
      message: 'Your privacy request has been logged and will be processed within 48 hours per GDPR SLA.',
    };
  }

  async listOrganizationRequests(eventId?: string) {
    if (eventId) {
      return this.db.query.privacyRequests.findMany({
        where: eq(privacyRequests.eventId, eventId),
        orderBy: [desc(privacyRequests.requestedAt)],
        with: {
          event: true,
          user: true,
        },
      });
    }

    return this.db.query.privacyRequests.findMany({
      orderBy: [desc(privacyRequests.requestedAt)],
      with: {
        event: true,
        user: true,
      },
    });
  }

  async processPrivacyRequest(
    requestId: string,
    organizationId: string,
    processedByUserId: string,
  ) {
    const request = await this.db.query.privacyRequests.findFirst({
      where: eq(privacyRequests.id, requestId),
      with: { event: true, user: true },
    });

    if (!request) {
      throw new NotFoundException('Privacy request not found');
    }

    if (request.status === 'COMPLETED') {
      throw new BadRequestException('Privacy request is already completed');
    }

    // 1. If deletion requested, revoke consent
    if (request.requestType === 'DELETION' && request.eventId && request.userId) {
      try {
        await this.db
          .update(consents)
          .set({ status: 'WITHDRAWN', withdrawnAt: new Date() })
          .where(
            and(
              eq(consents.userId, request.userId),
              eq(consents.eventId, request.eventId),
            ),
          );
      } catch {
        // Continue
      }
    }

    // 2. Mark request completed
    const [updated] = await this.db
      .update(privacyRequests)
      .set({
        status: 'COMPLETED',
        completedAt: new Date(),
        adminNotes: `Processed by ${processedByUserId}`,
      })
      .where(eq(privacyRequests.id, requestId))
      .returning();

    // 3. Audit log
    await this.db.insert(auditLogs).values({
      organizationId,
      actorId: processedByUserId,
      eventId: request.eventId ?? null,
      action: 'PRIVACY_REQUEST_PROCESSED',
      resourceType: 'privacy_request',
      resourceId: requestId,
      metadata: {
        requestType: request.requestType,
      },
    });

    return updated;
  }
}
