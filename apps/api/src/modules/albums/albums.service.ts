import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { DB_TOKEN } from '../../database/database.module.js';
import type { Database } from '@lensrecall/db';
import { albums, photos, events } from '@lensrecall/db';
import { eq, and, sql } from 'drizzle-orm';
import { CreateAlbumSchema, UpdateAlbumSchema } from '@lensrecall/shared';

@Injectable()
export class AlbumsService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  async create(eventId: string, data: typeof CreateAlbumSchema._type) {
    const [album] = await this.db
      .insert(albums)
      .values({
        eventId,
        name: data.name,
        description: data.description,
        coverPhotoId: data.coverPhotoId,
        isDefault: false,
      })
      .returning();

    return album;
  }

  async list(eventId: string) {
    const albumList = await this.db.query.albums.findMany({
      where: eq(albums.eventId, eventId),
      orderBy: (albums, { desc }) => [desc(albums.isDefault), desc(albums.createdAt)],
    });

    // Attach photo counts per album
    const results = await Promise.all(
      albumList.map(async (alb) => {
        const [photoStat] = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(photos)
          .where(eq(photos.albumId, alb.id));

        return {
          ...alb,
          photoCount: Number(photoStat?.count ?? 0),
        };
      }),
    );

    return results;
  }

  async update(albumId: string, data: typeof UpdateAlbumSchema._type) {
    const [updated] = await this.db
      .update(albums)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(albums.id, albumId))
      .returning();

    if (!updated) {
      throw new NotFoundException('Album not found');
    }

    return updated;
  }

  async delete(albumId: string) {
    const album = await this.db.query.albums.findFirst({
      where: eq(albums.id, albumId),
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    if (album.isDefault) {
      throw new BadRequestException('Cannot delete default album');
    }

    // Set photos albumId to null (or fallback to default)
    await this.db
      .update(photos)
      .set({ albumId: null })
      .where(eq(photos.albumId, albumId));

    await this.db.delete(albums).where(eq(albums.id, albumId));

    return { message: 'Album deleted' };
  }
}
