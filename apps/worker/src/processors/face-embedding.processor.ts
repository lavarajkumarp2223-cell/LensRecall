import type { Job } from 'bullmq';
import type { FaceEmbeddingJobData } from '@lensrecall/shared';
import { db, photos, photoFaces } from '@lensrecall/db';
import { eq, and, sql } from 'drizzle-orm';
import { getStorageService } from '../services/storage.factory.js';
import { getFaceRecognitionService } from '../services/face-recognition.factory.js';

const storageService = getStorageService();
const faceRecognitionService = getFaceRecognitionService();

export async function faceEmbeddingProcessor(job: Job<FaceEmbeddingJobData>): Promise<void> {
  const { photoFaceId, photoId, eventId, storageKey, boundingBox } = job.data;

  console.log(`[FaceEmbedding] Indexing face ${photoFaceId} for event ${eventId}`);

  // Download image for embedding
  const imageBuffer = await storageService.downloadBuffer(storageKey);

  // Get the collection ID for this event
  const eventCollectionId = `${process.env['REKOGNITION_COLLECTION_PREFIX'] ?? 'lensrecall'}_${eventId}`;

  // Index face into the event's Rekognition collection
  // This stores the embedding inside AWS Rekognition — we never touch raw embeddings
  const indexResult = await faceRecognitionService.indexFace(
    imageBuffer,
    { boundingBox, confidence: 1, qualityScore: 1 },
    eventCollectionId,
  );

  // Store the external face ID in our DB (links photo_face to Rekognition's internal embedding)
  await db
    .update(photoFaces)
    .set({ externalFaceId: indexResult.externalFaceId })
    .where(eq(photoFaces.id, photoFaceId));

  // Check if all faces for this photo have been indexed
  const pendingFaces = await db.query.photoFaces.findMany({
    where: and(
      eq(photoFaces.photoId, photoId),
      sql`${photoFaces.externalFaceId} IS NULL`,
    ),
  });

  if (pendingFaces.length === 0) {
    // All faces indexed — photo is READY
    await db
      .update(photos)
      .set({ processingStatus: 'READY', updatedAt: new Date() })
      .where(eq(photos.id, photoId));
    console.log(`[FaceEmbedding] ✓ Photo ${photoId} fully indexed — status: READY`);
  }
}
