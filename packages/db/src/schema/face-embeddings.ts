/**
 * pgvector table for face embeddings.
 *
 * This is kept in a separate file because it requires the pgvector extension
 * and uses the `vector` column type from `drizzle-orm/pg-core`.
 *
 * SECURITY: This table contains biometric-adjacent data.
 * Access must be strictly controlled:
 * - Never query this table from user-facing API routes directly
 * - Only the FaceRecognitionService / VectorSearchService may access it
 * - Never log or return embedding values
 * - Every query MUST include an event_id filter
 */
import { pgTable, uuid, timestamp, index, customType } from 'drizzle-orm/pg-core';
import { photos, photoFaces, events } from './tables.js';

// Custom vector type for pgvector
// Rekognition embeddings are 128-dimensional
const vector = customType<{ data: number[]; driverData: string; config: { dimensions?: number } }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 128})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return value
      .slice(1, -1)
      .split(',')
      .map((v) => parseFloat(v));
  },
});

/**
 * face_embeddings — stores the vector embeddings for each detected face.
 *
 * Index strategy:
 * - ivfflat with cosine ops for approximate nearest neighbor search
 * - Partial filter on event_id is handled at the query level via WHERE clause
 * - For scale (>1M vectors), migrate to pgvector HNSW or a dedicated vector DB
 */
export const faceEmbeddings = pgTable(
  'face_embeddings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // MANDATORY: every embedding must be scoped to an event
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    photoId: uuid('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'cascade' }),
    photoFaceId: uuid('photo_face_id')
      .notNull()
      .references(() => photoFaces.id, { onDelete: 'cascade' }),
    // The 128-dim embedding vector
    // NEVER returned to API clients
    embedding: vector('embedding', { dimensions: 128 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('face_embeddings_event_idx').on(t.eventId),
    index('face_embeddings_photo_face_idx').on(t.photoFaceId),
    // Vector index created via raw SQL migration — drizzle-kit doesn't support ivfflat natively
    // See: migrations/0001_create_vector_index.sql
  ],
);

export type FaceEmbeddingInsert = typeof faceEmbeddings.$inferInsert;
export type FaceEmbeddingSelect = typeof faceEmbeddings.$inferSelect;
