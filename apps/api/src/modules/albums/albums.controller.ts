import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlbumsService } from './albums.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CreateAlbumSchema, UpdateAlbumSchema } from '@lensrecall/shared';

@ApiTags('albums')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an album for an event' })
  async create(
    @Param('eventId') eventId: string,
    @Body() body: typeof CreateAlbumSchema._type,
  ) {
    const validated = CreateAlbumSchema.parse(body);
    const album = await this.albumsService.create(eventId, validated);
    return { success: true, data: album };
  }

  @Get()
  @ApiOperation({ summary: 'List all albums for an event' })
  async list(@Param('eventId') eventId: string) {
    const albums = await this.albumsService.list(eventId);
    return { success: true, data: albums };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an album' })
  async update(
    @Param('id') albumId: string,
    @Body() body: typeof UpdateAlbumSchema._type,
  ) {
    const validated = UpdateAlbumSchema.parse(body);
    const updated = await this.albumsService.update(albumId, validated);
    return { success: true, data: updated };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an album' })
  async delete(@Param('id') albumId: string) {
    const result = await this.albumsService.delete(albumId);
    return { success: true, data: result };
  }
}
