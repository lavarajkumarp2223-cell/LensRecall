import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DownloadsService } from './downloads.service.js';
import { JwtAuthGuard, type JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { RequestZipDownloadSchema } from '@lensrecall/shared';

@ApiTags('downloads')
@Controller()
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Public()
  @Get('photos/:id/download-url')
  @ApiOperation({ summary: 'Get direct high-res download URL for a single photo' })
  async getSinglePhotoDownloadUrl(@Param('id') photoId: string) {
    const result = await this.downloadsService.getSinglePhotoDownloadUrl(photoId);
    return { success: true, data: result };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('downloads/zip')
  @ApiOperation({ summary: 'Request asynchronous bulk ZIP download generation' })
  async requestZipDownload(
    @CurrentUser() user: JwtPayload,
    @Body() body: typeof RequestZipDownloadSchema._type,
  ) {
    const validated = RequestZipDownloadSchema.parse(body);
    const result = await this.downloadsService.requestZipDownload(
      user.sub,
      validated,
    );
    return { success: true, data: result };
  }

  @Public()
  @Get('downloads/jobs/:id')
  @ApiOperation({ summary: 'Poll status of a background ZIP archive creation job' })
  async getDownloadJobStatus(@Param('id') jobId: string) {
    const result = await this.downloadsService.getDownloadJobStatus(jobId);
    return { success: true, data: result };
  }
}
