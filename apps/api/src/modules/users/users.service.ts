import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DB_TOKEN } from '../../database/database.module.js';
import type { Database } from '@lensrecall/db';
import { users, organizationMembers } from '@lensrecall/db';
import { eq } from 'drizzle-orm';
import { UpdateUserSchema } from '@lensrecall/shared';

@Injectable()
export class UsersService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  async getProfile(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get organizations
    const memberships = await this.db.query.organizationMembers.findMany({
      where: eq(organizationMembers.userId, userId),
      with: {
        organization: true,
      },
    });

    return {
      ...user,
      organizations: memberships.map((m: any) => ({
        organizationId: m.organizationId,
        role: m.role,
        name: m.organization?.name,
        slug: m.organization?.slug,
        plan: m.organization?.plan,
      })),
    };
  }

  async updateProfile(userId: string, data: typeof UpdateUserSchema._type) {
    const [updated] = await this.db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        phone: users.phone,
        role: users.role,
      });

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return updated;
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.passwordHash) {
      throw new BadRequestException('Password change not available for this account');
    }

    const isValid = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password incorrect');
    }

    const passwordHash = await bcrypt.hash(newPass, 12);
    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { message: 'Password updated successfully' };
  }
}
