import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UploadsService } from './uploads.service.js';
import { JwtAuthGuard, type JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  PresignedUploadUrlRequestSchema,
  ConfirmUploadBatchSchema,
} from '@lensrecall/shared';

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presigned-urls')
  @ApiOperation({ summary: 'Generate direct Cloudflare R2 presigned PUT upload URLs' })
  async getPresignedUrls(
    @CurrentUser() user: JwtPayload,
    @Body() body: any,
  ) {
    const validated = PresignedUploadUrlRequestSchema.parse(body);
    const orgId = user.organizationId;
    if (!orgId) throw new Error('User has no active organization');

    const result = await this.uploadsService.getPresignedUrls(
      user.sub,
      orgId,
      body.eventId,
      validated,
    );
    return { success: true, data: result };
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm completed uploads and enqueue background AI processing jobs' })
  async confirmUploadBatch(
    @CurrentUser() user: JwtPayload,
    @Body() body: any,
  ) {
    const orgId = user.organizationId;
    if (!orgId) throw new Error('User has no active organization');

    const result = await this.uploadsService.confirmUploadBatch(
      user.sub,
      orgId,
      body.eventId,
      body,
    );
    return { success: true, data: result };
  }
}
