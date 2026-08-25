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
  organizations,
  events,
  photos,
  auditLogs,
} from '@lensrecall/db';
import { eq, sql } from 'drizzle-orm';
import { SUBSCRIPTION_PLANS, CreateCheckoutSessionSchema } from '@lensrecall/shared';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  async getSubscriptionDetails(organizationId: string) {
    const org = await this.db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const planKey = (org.plan as keyof typeof SUBSCRIPTION_PLANS) || 'FREE';
    const planConfig = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.FREE;

    // Calculate actual usage
    const [eventStat] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(eq(events.organizationId, organizationId));

    const [photoStat] = await this.db
      .select({
        count: sql<number>`count(*)`,
        totalBytes: sql<number>`coalesce(sum(${photos.fileSizeBytes}), 0)`,
      })
      .from(photos)
      .innerJoin(events, eq(photos.eventId, events.id))
      .where(eq(events.organizationId, organizationId));

    const totalBytes = Number(photoStat?.totalBytes ?? 0);
    const storageUsedGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(1);

    return {
      organizationId: org.id,
      organizationName: org.name,
      plan: planKey,
      planName: planConfig.name,
      priceMonthlyINR: planConfig.priceMonthlyINR,
      status: org.status,
      limits: {
        maxEvents: planConfig.maxEvents,
        maxPhotosPerEvent: planConfig.maxPhotosPerEvent,
        storageGB: planConfig.storageGB,
      },
      usage: {
        activeEvents: Number(eventStat?.count ?? 0),
        totalPhotos: Number(photoStat?.count ?? 0),
        storageUsedGB: parseFloat(storageUsedGB),
      },
      features: planConfig.features,
    };
  }

  async createCheckoutSession(
    organizationId: string,
    userId: string,
    data: typeof CreateCheckoutSessionSchema._type,
  ) {
    const org = await this.db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const planKey = data.plan;
    const planConfig = SUBSCRIPTION_PLANS[planKey];
    if (!planConfig) {
      throw new BadRequestException(`Invalid plan: ${planKey}`);
    }

    // In local/mock mode: upgrade organization directly and return mock checkout URL
    await this.db
      .update(organizations)
      .set({
        plan: planKey,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId));

    await this.db.insert(auditLogs).values({
      organizationId,
      userId,
      action: 'SUBSCRIPTION_UPGRADED',
      entityType: 'organization',
      entityId: organizationId,
      metadata: { plan: planKey, priceINR: planConfig.priceMonthlyINR },
    });

    const webUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
    return {
      checkoutUrl: `${webUrl}/organizer/settings?plan=upgraded&success=true`,
      plan: planKey,
      status: 'ACTIVE',
    };
  }

  async createBillingPortalSession(organizationId: string) {
    const webUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
    return {
      portalUrl: `${webUrl}/organizer/settings`,
    };
  }
}
