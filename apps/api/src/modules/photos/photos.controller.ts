import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PhotosService } from './photos.service.js';
import { JwtAuthGuard, type JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('photos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Get('events/:eventId/photos')
  @ApiOperation({ summary: 'List photos for an event with thumbnail URLs' })
  async listEventPhotos(
    @CurrentUser() user: JwtPayload,
    @Param('eventId') eventId: string,
    @Query('albumId') albumId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const orgId = user.organizationId;
    if (!orgId) throw new Error('User has no active organization');

    const result = await this.photosService.listEventPhotos(eventId, orgId, {
      albumId,
      status,
      limit: limit ? parseInt(limit, 10) : 40,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return { success: true, data: result };
  }

  @Get('photos/:id')
  @ApiOperation({ summary: 'Get photo details including face bounding boxes' })
  async getPhotoDetails(@Param('id') photoId: string) {
    const photo = await this.photosService.getPhotoDetails(photoId);
    return { success: true, data: photo };
  }

  @Delete('photos/:id')
  @ApiOperation({ summary: 'Delete a photo, thumbnails, and indexed faces' })
  async deletePhoto(
    @CurrentUser() user: JwtPayload,
    @Param('id') photoId: string,
  ) {
    const result = await this.photosService.deletePhoto(photoId, user.sub);
    return { success: true, data: result };
  }

  @Post('photos/:id/retry')
  @ApiOperation({ summary: 'Retry failed image or face processing' })
  async retryProcessing(@Param('id') photoId: string) {
    const result = await this.photosService.retryProcessing(photoId);
    return { success: true, data: result };
  }
}
