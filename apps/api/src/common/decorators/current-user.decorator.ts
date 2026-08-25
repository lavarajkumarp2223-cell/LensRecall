import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../guards/jwt-auth.guard.js';
import type { FastifyRequest } from 'fastify';

/**
 * CurrentUser() — extracts the authenticated user from the request.
 *
 * Usage:
 * @Get('profile')
 * getProfile(@CurrentUser() user: JwtPayload) { ... }
 *
 * Optionally extract a specific field:
 * @Get('profile')
 * getProfile(@CurrentUser('id') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (field: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest & { user: JwtPayload }>();
    const user = request.user;
    return field ? user[field] : user;
  },
);
