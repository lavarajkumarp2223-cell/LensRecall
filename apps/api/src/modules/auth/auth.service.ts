import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'node:crypto';
import { DB_TOKEN } from '../../database/database.module.js';
import type { Database } from '@lensrecall/db';
import {
  users,
  organizations,
  organizationMembers,
  verificationTokens,
  auditLogs,
} from '@lensrecall/db';
import { eq, and, gt } from 'drizzle-orm';
import {
  UserRole,
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  MagicLinkRequestSchema,
  MagicLinkVerifySchema,
  GoogleAuthSchema,
} from '@lensrecall/shared';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { NotificationService } from '../../providers/notifications/notification.service.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    @Inject(DB_TOKEN) private readonly db: Database,
    private readonly notificationService: NotificationService,
  ) {}

  async register(data: typeof RegisterSchema._type) {
    const existing = await this.db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase()),
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user and optionally default organization in a transaction
    return await this.db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          email: data.email.toLowerCase(),
          fullName: data.fullName,
          passwordHash,
          role: data.role ?? UserRole.ORGANIZER,
          status: 'ACTIVE',
        })
        .returning();

      if (!newUser) {
        throw new BadRequestException('Failed to create user');
      }

      let organizationId: string | undefined;

      // If registering as organizer, create an organization automatically
      if (newUser.role === UserRole.ORGANIZER || data.organizationName) {
        const orgName = data.organizationName || `${data.fullName}'s Studio`;
        const slug = orgName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') + `-${randomBytes(3).toString('hex')}`;

        const [newOrg] = await tx
          .insert(organizations)
          .values({
            name: orgName,
            slug,
            ownerId: newUser.id,
            plan: 'FREE',
            status: 'ACTIVE',
          })
          .returning();

        if (newOrg) {
          organizationId = newOrg.id;
          await tx.insert(organizationMembers).values({
            organizationId: newOrg.id,
            userId: newUser.id,
            role: 'OWNER',
          });
        }
      }

      // Log registration
      await tx.insert(auditLogs).values({
        organizationId: organizationId ?? null,
        userId: newUser.id,
        action: 'USER_REGISTERED',
        entityType: 'user',
        entityId: newUser.id,
        metadata: { role: newUser.role },
      });

      const tokens = await this.generateTokens(
        newUser.id,
        newUser.email,
        newUser.role,
        organizationId,
      );

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          avatarUrl: newUser.avatarUrl,
        },
        organizationId,
        tokens,
      };
    });
  }

  async login(data: typeof LoginSchema._type) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase()),
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is suspended or inactive');
    }

    // Get user's primary organization
    const membership = await this.db.query.organizationMembers.findFirst({
      where: eq(organizationMembers.userId, user.id),
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      membership?.organizationId,
    );

    // Update last login
    await this.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Audit log
    await this.db.insert(auditLogs).values({
      organizationId: membership?.organizationId ?? null,
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      organizationId: membership?.organizationId,
      tokens,
    };
  }

  async refreshToken(data: typeof RefreshTokenSchema._type) {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        data.refreshToken,
        { secret: process.env['JWT_SECRET'] },
      );

      const user = await this.db.query.users.findFirst({
        where: eq(users.id, payload.sub),
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User no longer active');
      }

      const membership = await this.db.query.organizationMembers.findFirst({
        where: eq(organizationMembers.userId, user.id),
      });

      const tokens = await this.generateTokens(
        user.id,
        user.email,
        user.role,
        membership?.organizationId,
      );

      return { tokens };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async requestMagicLink(data: typeof MagicLinkRequestSchema._type) {
    const email = data.email.toLowerCase();
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store token
    await this.db.insert(verificationTokens).values({
      identifier: email,
      token,
      expiresAt,
    });

    const webUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
    const magicLinkUrl = `${webUrl}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email
    await this.notificationService.sendEmail({
      to: email,
      template: 'magic-link',
      data: {
        url: magicLinkUrl,
        name: 'Guest',
      },
    });

    return { message: 'Magic link sent if email is valid' };
  }

  async verifyMagicLink(data: typeof MagicLinkVerifySchema._type) {
    const email = data.email.toLowerCase();

    const record = await this.db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, data.token),
        gt(verificationTokens.expiresAt, new Date()),
      ),
    });

    if (!record) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    // Delete used token
    await this.db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.token, data.token),
        ),
      );

    // Find or create guest/user
    let user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      const [created] = await this.db
        .insert(users)
        .values({
          email,
          fullName: email.split('@')[0] || 'Guest User',
          role: UserRole.GUEST,
          status: 'ACTIVE',
          emailVerified: new Date(),
        })
        .returning();
      user = created;
    }

    if (!user) {
      throw new BadRequestException('Failed to process user authentication');
    }

    const membership = await this.db.query.organizationMembers.findFirst({
      where: eq(organizationMembers.userId, user.id),
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      membership?.organizationId,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      tokens,
    };
  }

  async googleAuth(data: typeof GoogleAuthSchema._type) {
    // In production with Google OAuth ID token verification
    // For now we accept verified profile data
    const email = data.email.toLowerCase();

    let user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      const [created] = await this.db
        .insert(users)
        .values({
          email,
          fullName: data.fullName,
          avatarUrl: data.avatarUrl,
          role: UserRole.GUEST,
          status: 'ACTIVE',
          emailVerified: new Date(),
        })
        .returning();
      user = created;
    } else if (data.avatarUrl && !user.avatarUrl) {
      await this.db
        .update(users)
        .set({ avatarUrl: data.avatarUrl })
        .where(eq(users.id, user.id));
    }

    if (!user) {
      throw new BadRequestException('Could not authenticate with Google');
    }

    const membership = await this.db.query.organizationMembers.findFirst({
      where: eq(organizationMembers.userId, user.id),
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      membership?.organizationId,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      organizationId: membership?.organizationId,
      tokens,
    };
  }

  async generateTokens(
    userId: string,
    email: string,
    role: string,
    organizationId?: string,
  ) {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      role,
      organizationId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: process.env['JWT_ACCESS_TOKEN_EXPIRY'] ?? '15m',
    });

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId },
      {
        secret: process.env['JWT_SECRET'] ?? 'dev-secret-key-change-in-production-12345',
        expiresIn: process.env['JWT_REFRESH_TOKEN_EXPIRY'] ?? '7d',
      },
    );

    return { accessToken, refreshToken };
  }
}
