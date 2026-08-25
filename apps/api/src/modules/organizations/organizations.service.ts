import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { DB_TOKEN } from '../../database/database.module.js';
import type { Database } from '@lensrecall/db';
import {
  organizations,
  organizationMembers,
  organizationInvitations,
  users,
  auditLogs,
} from '@lensrecall/db';
import { eq, and, gt } from 'drizzle-orm';
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  InviteMemberSchema,
  UserRole,
} from '@lensrecall/shared';
import { NotificationService } from '../../providers/notifications/notification.service.js';

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Database,
    private readonly notificationService: NotificationService,
  ) {}

  async create(userId: string, data: typeof CreateOrganizationSchema._type) {
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + `-${randomBytes(3).toString('hex')}`;

    const existing = await this.db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
    });

    if (existing) {
      throw new ConflictException('An organization with this slug already exists');
    }

    return await this.db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({
          name: data.name,
          slug,
          ownerId: userId,
          plan: 'FREE',
          status: 'ACTIVE',
        })
        .returning();

      if (!org) {
        throw new BadRequestException('Failed to create organization');
      }

      await tx.insert(organizationMembers).values({
        organizationId: org.id,
        userId,
        role: 'OWNER',
      });

      await tx.insert(auditLogs).values({
        organizationId: org.id,
        userId,
        action: 'ORGANIZATION_CREATED',
        entityType: 'organization',
        entityId: org.id,
      });

      return org;
    });
  }

  async getById(orgId: string, userId: string) {
    await this.assertMember(orgId, userId);

    const org = await this.db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async update(
    orgId: string,
    userId: string,
    data: typeof UpdateOrganizationSchema._type,
  ) {
    await this.assertRole(orgId, userId, ['OWNER', 'ADMIN']);

    const [updated] = await this.db
      .update(organizations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))
      .returning();

    if (!updated) {
      throw new NotFoundException('Organization not found');
    }

    return updated;
  }

  async listMembers(orgId: string, userId: string) {
    await this.assertMember(orgId, userId);

    const members = await this.db.query.organizationMembers.findMany({
      where: eq(organizationMembers.organizationId, orgId),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    return members.map((m) => ({
      id: m.id,
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.user,
    }));
  }

  async inviteMember(
    orgId: string,
    invitedByUserId: string,
    data: typeof InviteMemberSchema._type,
  ) {
    await this.assertRole(orgId, invitedByUserId, ['OWNER', 'ADMIN']);

    const email = data.email.toLowerCase();
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [invitation] = await this.db
      .insert(organizationInvitations)
      .values({
        organizationId: orgId,
        email,
        role: data.role,
        token,
        invitedBy: invitedByUserId,
        expiresAt,
      })
      .returning();

    if (!invitation) {
      throw new BadRequestException('Failed to create invitation');
    }

    const org = await this.db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });

    const webUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
    const acceptUrl = `${webUrl}/invitations/accept?token=${token}`;

    await this.notificationService.sendEmail({
      to: email,
      template: 'photographer-invitation',
      data: {
        eventName: org?.name ?? 'our organization',
        acceptUrl,
      },
    });

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  }

  async acceptInvitation(token: string, userId: string) {
    const invite = await this.db.query.organizationInvitations.findFirst({
      where: and(
        eq(organizationInvitations.token, token),
        eq(organizationInvitations.status, 'PENDING'),
        gt(organizationInvitations.expiresAt, new Date()),
      ),
    });

    if (!invite) {
      throw new NotFoundException('Invalid or expired invitation');
    }

    return await this.db.transaction(async (tx) => {
      // Add member
      await tx.insert(organizationMembers).values({
        organizationId: invite.organizationId,
        userId,
        role: invite.role,
      });

      // Update invite status
      await tx
        .update(organizationInvitations)
        .set({ status: 'ACCEPTED' })
        .where(eq(organizationInvitations.id, invite.id));

      return { organizationId: invite.organizationId, role: invite.role };
    });
  }

  async removeMember(orgId: string, requestingUserId: string, targetUserId: string) {
    await this.assertRole(orgId, requestingUserId, ['OWNER', 'ADMIN']);

    if (requestingUserId === targetUserId) {
      throw new BadRequestException('Cannot remove yourself as organization owner');
    }

    await this.db
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, targetUserId),
        ),
      );

    return { message: 'Member removed successfully' };
  }

  async updateMemberRole(
    orgId: string,
    requestingUserId: string,
    targetUserId: string,
    newRole: string,
  ) {
    await this.assertRole(orgId, requestingUserId, ['OWNER']);

    await this.db
      .update(organizationMembers)
      .set({ role: newRole })
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, targetUserId),
        ),
      );

    return { message: 'Member role updated' };
  }

  // ─── RBAC Helpers ──────────────────────────────────────────────────────────

  private async assertMember(orgId: string, userId: string) {
    const membership = await this.db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.userId, userId),
      ),
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return membership;
  }

  private async assertRole(orgId: string, userId: string, allowedRoles: string[]) {
    const membership = await this.assertMember(orgId, userId);
    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `Action requires one of: ${allowedRoles.join(', ')}. Current role: ${membership.role}`,
      );
    }
    return membership;
  }
}
