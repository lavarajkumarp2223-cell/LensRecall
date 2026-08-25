import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { JwtPayload } from './jwt-auth.guard.js';
import type { FastifyRequest } from 'fastify';
import { UserRole } from '@lensrecall/shared';

/**
 * RolesGuard — Enforces role-based access control.
 *
 * Usage:
 * @Roles(UserRole.ORGANIZER, UserRole.SUPER_ADMIN)
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * async myMethod() {}
 *
 * SUPER_ADMIN implicitly passes all role checks.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator means any authenticated user can access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest & { user: JwtPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No user context found');
    }

    // Super admin can access everything
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role as UserRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access requires one of: ${requiredRoles.join(', ')}. ` +
          `Your role: ${user.role}`,
      );
    }

    return true;
  }
}
