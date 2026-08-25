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
import { PrivacyService } from './privacy.service.js';
import { JwtAuthGuard, type JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CreatePrivacyRequestSchema } from '@lensrecall/shared';
import type { FastifyRequest } from 'fastify';

@ApiTags('privacy')
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Public()
  @Post('requests')
  @ApiOperation({ summary: 'Submit a guest data deletion or access request' })
  async submitPrivacyRequest(
    @Body() body: typeof CreatePrivacyRequestSchema._type,
    @Req() request: FastifyRequest,
  ) {
    const validated = CreatePrivacyRequestSchema.parse(body);
    const result = await this.privacyService.submitPrivacyRequest(
      body.userId || '00000000-0000-0000-0000-000000000000',
      validated,
      request.ip,
    );
    return { success: true, data: result };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('requests')
  @ApiOperation({ summary: 'List organization privacy and deletion requests' })
  async listOrganizationRequests(@CurrentUser() user: JwtPayload) {
    const orgId = user.organizationId;
    if (!orgId) throw new Error('User has no active organization');

    const result = await this.privacyService.listOrganizationRequests(orgId);
    return { success: true, data: result };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('requests/:id/process')
  @ApiOperation({ summary: 'Execute and approve a privacy deletion request' })
  async processPrivacyRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') requestId: string,
  ) {
    const orgId = user.organizationId;
    if (!orgId) throw new Error('User has no active organization');

    const result = await this.privacyService.processPrivacyRequest(
      requestId,
      orgId,
      user.sub,
    );
    return { success: true, data: result };
  }
}
