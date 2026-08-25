import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import * as QRCode from 'qrcode';
import { DB_TOKEN } from '../../database/database.module.js';
import type { Database } from '@lensrecall/db';
import {
  qrCodes,
  events,
  auditLogs,
} from '@lensrecall/db';
import { eq, and, sql } from 'drizzle-orm';
import { GenerateQrCodeSchema } from '@lensrecall/shared';

@Injectable()
export class QrCodesService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  async listForEvent(eventId: string, organizationId: string) {
    // Verify event belongs to org
    const event = await this.db.query.events.findFirst({
      where: and(eq(events.id, eventId), eq(events.organizationId, organizationId)),
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const codes = await this.db.query.qrCodes.findMany({
      where: eq(qrCodes.eventId, eventId),
      orderBy: (qrCodes, { desc }) => [desc(qrCodes.createdAt)],
    });

    const webUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';

    return codes.map((c) => ({
      ...c,
      targetUrl: `${webUrl}/e/${c.token}`,
    }));
  }

  async generate(
    eventId: string,
    organizationId: string,
    userId: string,
    data?: typeof GenerateQrCodeSchema._type,
  ) {
    const event = await this.db.query.events.findFirst({
      where: and(eq(events.id, eventId), eq(events.organizationId, organizationId)),
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const token = randomBytes(16).toString('hex');
    const label = data?.label ?? `Event QR — ${new Date().toLocaleDateString()}`;

    const [created] = await this.db
      .insert(qrCodes)
      .values({
        eventId,
        token,
        label,
        status: 'ACTIVE',
        createdBy: userId,
      })
      .returning();

    const webUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
    const targetUrl = `${webUrl}/e/${token}`;

    // Generate Data URL SVG / PNG
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: '#0a0a0b',
        light: '#ffffff',
      },
    });

    await this.db.insert(auditLogs).values({
      organizationId,
      actorId: userId,
      eventId,
      action: 'QR_CODE_GENERATED',
      resourceType: 'qr_code',
      resourceId: created!.id,
      metadata: { eventId, token },
    });

    return {
      ...created,
      targetUrl,
      qrDataUrl,
    };
  }

  async validatePublicToken(token: string) {
    const qr = await this.db.query.qrCodes.findFirst({
      where: and(eq(qrCodes.token, token), eq(qrCodes.status, 'ACTIVE')),
      with: {
        event: {
          with: {
            organization: {
              columns: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!qr || !qr.event) {
      throw new NotFoundException('Invalid, expired, or deactivated event QR code');
    }

    const event = qr.event as any;

    if (event.status === 'ARCHIVED') {
      throw new BadRequestException(`Event discovery is currently ${event.status.toLowerCase()}`);
    }

    // Increment scan count
    await this.db
      .update(qrCodes)
      .set({
        scanCount: sql`${qrCodes.scanCount} + 1`,
      })
      .where(eq(qrCodes.id, qr.id));

    return {
      valid: true,
      token,
      event: {
        id: event.id,
        name: event.name,
        slug: event.slug,
        description: event.description,
        venue: event.venue,
        startDate: event.startDate,
        status: event.status,
        organization: event.organization,
      },
    };
  }

  async regenerate(eventId: string, organizationId: string, userId: string) {
    // Deactivate previous codes
    await this.db
      .update(qrCodes)
      .set({ status: 'DISABLED' })
      .where(eq(qrCodes.eventId, eventId));

    // Issue fresh code
    return this.generate(eventId, organizationId, userId, {
      label: `Regenerated Standee QR`,
    });
  }
}
