import type { Job } from 'bullmq';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import type { FaceDetectionJobData, FaceEmbeddingJobData } from '@lensrecall/shared';
import { QUEUE_NAMES } from '@lensrecall/shared';
import { db, photos, photoFaces } from '@lensrecall/db';
import { eq } from 'drizzle-orm';
import { getStorageService } from '../services/storage.factory.js';
import { getFaceRecognitionService } from '../services/face-recognition.factory.js';

const connection = new IORedis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const faceEmbeddingQueue = new Queue(QUEUE_NAMES.FACE_EMBEDDING, { connection });
const storageService = getStorageService();
const faceRecognitionService = getFaceRecognitionService();

export async function faceDetectionProcessor(job: Job<FaceDetectionJobData>): Promise<void> {
  const { photoId, eventId, storageKey } = job.data;

  console.log(`[FaceDetection] Processing photo ${photoId}`);

  await db
    .update(photos)
    .set({ processingStatus: 'FACE_DETECTION', updatedAt: new Date() })
    .where(eq(photos.id, photoId));

  // Download image for face detection
  const imageBuffer = await storageService.downloadBuffer(storageKey);

  // Detect all faces
  const detectedFaces = await faceRecognitionService.detectFaces(imageBuffer);

  if (detectedFaces.length === 0) {
    console.log(`[FaceDetection] No faces found in photo ${photoId}`);
    await db
      .update(photos)
      .set({ processingStatus: 'READY', updatedAt: new Date() })
      .where(eq(photos.id, photoId));
    return;
  }

  console.log(`[FaceDetection] Found ${detectedFaces.length} faces in photo ${photoId}`);

  // Create photo_face records for usable faces
  const embeddingJobs: FaceEmbeddingJobData[] = [];

  for (const face of detectedFaces) {
    const qualityResult = faceRecognitionService.validateFaceQuality(face);

    if (!qualityResult.isUsable) {
      console.log(`[FaceDetection] Skipping low-quality face (reason: ${qualityResult.reason})`);
      continue;
    }

    // Insert photo_face record
    const [insertedFace] = await db
      .insert(photoFaces)
      .values({
        photoId,
        eventId,
        boundingBoxLeft: face.boundingBox.left.toString(),
        boundingBoxTop: face.boundingBox.top.toString(),
        boundingBoxWidth: face.boundingBox.width.toString(),
        boundingBoxHeight: face.boundingBox.height.toString(),
        qualityScore: face.qualityScore.toString(),
        detectionConfidence: face.confidence.toString(),
      })
      .returning();

    if (insertedFace) {
      embeddingJobs.push({
        photoFaceId: insertedFace.id,
        photoId,
        eventId,
        storageKey,
        boundingBox: face.boundingBox,
      });
    }
  }

  // Update status to FACE_INDEXING before enqueueing embedding jobs
  await db
    .update(photos)
    .set({ processingStatus: 'FACE_INDEXING', updatedAt: new Date() })
    .where(eq(photos.id, photoId));

  // Enqueue one embedding job per usable face
  if (embeddingJobs.length > 0) {
    await faceEmbeddingQueue.addBulk(
      embeddingJobs.map((jobData) => ({
        name: 'embed-face',
        data: jobData,
        opts: {
          attempts: parseInt(process.env['QUEUE_MAX_ATTEMPTS'] ?? '3', 10),
          backoff: { type: 'exponential' as const, delay: 5000 },
        },
      })),
    );
    console.log(`[FaceDetection] Enqueued ${embeddingJobs.length} face embedding jobs for photo ${photoId}`);
  } else {
    // No usable faces — mark as ready
    await db
      .update(photos)
      .set({ processingStatus: 'READY', updatedAt: new Date() })
      .where(eq(photos.id, photoId));
  }
}
