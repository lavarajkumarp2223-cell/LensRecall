import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConsentService } from './consent.service.js';
import { JwtAuthGuard, type JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RecordConsentSchema } from '@lensrecall/shared';
import type { FastifyRequest } from 'fastify';

@ApiTags('consent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/consent')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  @ApiOperation({ summary: 'Record guest explicit biometric consent for face search' })
  async recordConsent(
    @CurrentUser() user: JwtPayload,
    @Param('eventId') eventId: string,
    @Body() body: typeof RecordConsentSchema._type,
    @Req() request: FastifyRequest,
  ) {
    const validated = RecordConsentSchema.parse(body);
    const result = await this.consentService.recordConsent(
      user.sub,
      eventId,
      validated,
      request.ip,
      request.headers['user-agent'],
    );
    return { success: true, data: result };
  }
}
