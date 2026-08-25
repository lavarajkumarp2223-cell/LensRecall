import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FaceDetectionService } from './face-detection.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('face-detection')
@Controller()
export class FaceDetectionController {
  constructor(private readonly faceDetectionService: FaceDetectionService) {}

  @Public()
  @Post('events/:token/face-search')
  @ApiOperation({ summary: 'Search event photo index by captured guest face image' })
  async searchGuestFaces(
    @Param('token') token: string,
    @Body() body: { imageBase64: string; userId?: string },
  ) {
    if (!body.imageBase64) {
      throw new Error('Image data is required');
    }

    // Strip data URL prefix if present
    const base64Data = body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const result = await this.faceDetectionService.searchGuestFacesByImage(
      token,
      buffer,
      body.userId,
    );

    return { success: true, data: result };
  }
}
