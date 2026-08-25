import {
  Injectable,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { DB_TOKEN } from '../../database/database.module.js';
import type { Database } from '@lensrecall/db';
import {
  consent,
  events,
  auditLogs,
} from '@lensrecall/db';
import { eq, and } from 'drizzle-orm';
import { RecordConsentSchema } from '@lensrecall/shared';

@Injectable()
export class ConsentService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  async recordConsent(
    userId: string,
    eventId: string,
    data: typeof RecordConsentSchema._type,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const event = await this.db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      throw new BadRequestException('Event not found');
    }

    const [recorded] = await this.db
      .insert(consent)
      .values({
        userId,
        eventId,
        consentType: 'BIOMETRIC_FACE_SEARCH',
        status: data.accepted ? 'GRANTED' : 'REVOKED',
        version: data.consentVersion ?? '1.0',
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        expiresAt: new Date(Date.now() + event.faceRetentionDays * 24 * 60 * 60 * 1000),
      })
      .returning();

    await this.db.insert(auditLogs).values({
      organizationId: event.organizationId,
      userId,
      action: 'CONSENT_GRANTED',
      entityType: 'consent',
      entityId: recorded!.id,
      metadata: { eventId, version: data.consentVersion },
    });

    return {
      success: true,
      consentId: recorded!.id,
      status: recorded!.status,
    };
  }

  async verifyConsent(userId: string, eventId: string) {
    const record = await this.db.query.consent.findFirst({
      where: and(
        eq(consent.userId, userId),
        eq(consent.eventId, eventId),
        eq(consent.status, 'GRANTED'),
      ),
    });

    return Boolean(record);
  }
}
