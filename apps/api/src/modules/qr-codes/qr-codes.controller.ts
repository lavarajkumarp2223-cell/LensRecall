import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QrCodesService } from './qr-codes.service.js';
import { JwtAuthGuard, type JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { GenerateQrCodeSchema } from '@lensrecall/shared';
import type { FastifyRequest } from 'fastify';

@ApiTags('qr-codes')
@Controller()
export class QrCodesController {
  constructor(private readonly qrService: QrCodesService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('events/:eventId/qr-codes')
  @ApiOperation({ summary: 'List all QR codes for an event' })
  async listForEvent(
    @CurrentUser() user: JwtPayload,
    @Param('eventId') eventId: string,
  ) {
    const orgId = user.organizationId;
    if (!orgId) throw new Error('User has no active organization');

    const list = await this.qrService.listForEvent(eventId, orgId);
    return { success: true, data: list };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('events/:eventId/qr-codes')
  @ApiOperation({ summary: 'Generate a new QR code for an event' })
  async generate(
    @CurrentUser() user: JwtPayload,
    @Param('eventId') eventId: string,
    @Body() body: typeof GenerateQrCodeSchema._type,
  ) {
    const validated = GenerateQrCodeSchema.parse(body);
    const orgId = user.organizationId;
    if (!orgId) throw new Error('User has no active organization');

    const result = await this.qrService.generate(
      eventId,
      orgId,
      user.sub,
      validated,
    );
    return { success: true, data: result };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('events/:eventId/qr-codes/regenerate')
  @ApiOperation({ summary: 'Deactivate older codes and issue a fresh QR token' })
  async regenerate(
    @CurrentUser() user: JwtPayload,
    @Param('eventId') eventId: string,
  ) {
    const orgId = user.organizationId;
    if (!orgId) throw new Error('User has no active organization');

    const result = await this.qrService.regenerate(eventId, orgId, user.sub);
    return { success: true, data: result };
  }

  @Public()
  @Get('qr/:token/validate')
  @ApiOperation({ summary: 'Public endpoint to validate a scanned QR token and fetch public event metadata' })
  async validatePublicToken(
    @Param('token') token: string,
    @Req() request: FastifyRequest,
  ) {
    const result = await this.qrService.validatePublicToken(token);
    return { success: true, data: result };
  }
}
