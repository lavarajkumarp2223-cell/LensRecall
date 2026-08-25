import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { FastifyRequest } from 'fastify';

export interface JwtPayload {
  sub: string;          // user ID
  email: string;
  role: string;
  organizationId?: string;
  eventId?: string;     // for event-scoped guest tokens
  iat: number;
  exp: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env['JWT_SECRET'],
      });

      // Attach to request for downstream use
      (request as FastifyRequest & { user: JwtPayload }).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }

  private extractBearerToken(request: FastifyRequest): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}
