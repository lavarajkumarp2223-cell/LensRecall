import { Injectable, Inject } from '@nestjs/common';
import { DB_TOKEN } from '../../database/database.module.js';
import type { Database } from '@lensrecall/db';
import { auditLogs } from '@lensrecall/db';
import { eq, desc, and } from 'drizzle-orm';

@Injectable()
export class AuditService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  async listOrganizationLogs(
    organizationId: string,
    options?: {
      action?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    let conditions = eq(auditLogs.organizationId, organizationId);
    if (options?.action) {
      conditions = and(conditions, eq(auditLogs.action, options.action))!;
    }

    const logs = await this.db.query.auditLogs.findMany({
      where: conditions,
      limit,
      offset,
      orderBy: [desc(auditLogs.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return logs;
  }
}
