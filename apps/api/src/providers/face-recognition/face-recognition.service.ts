/**
 * FaceRecognitionService — Abstract interface for face detection and matching.
 *
 * This is the most security-sensitive abstraction in LensRecall.
 *
 * Concrete adapters:
 * - RekognitionAdapter (AWS Rekognition)
 * - MockFaceRecognitionAdapter (development only — NO real recognition)
 *
 * CRITICAL RULES:
 * 1. Embeddings (Float32Array) are NEVER returned to API clients
 * 2. Embeddings are NEVER logged
 * 3. Embeddings are NEVER put in analytics events
 * 4. Every search MUST include an eventId — cross-event search is forbidden
 * 5. The mock adapter MUST be clearly labeled and blocked in production
 */
import type { FaceBoundingBox } from '@lensrecall/shared';

export interface DetectedFace {
  boundingBox: FaceBoundingBox;
  confidence: number; // 0-1
  qualityScore: number; // 0-1, higher is better
  landmarks?: FaceLandmark[] | undefined;
  // Provider-specific face ID (e.g. Rekognition FaceId stored in collection)
  externalFaceId?: string | undefined;
}

export interface FaceLandmark {
  type: string;
  x: number;
  y: number;
}

export interface FaceQualityResult {
  isUsable: boolean;
  reason?: 'QUALITY_TOO_LOW' | 'FACE_TOO_SMALL' | 'FACE_OCCLUDED' | 'POOR_LIGHTING';
  qualityScore: number;
}

export interface FaceSearchMatch {
  externalFaceId: string;
  similarityScore: number; // 0-100 for Rekognition, normalized to 0-1 internally
  photoFaceId?: string;   // resolved after DB lookup
  photoId?: string;        // resolved after DB lookup
}

export interface IndexFaceResult {
  externalFaceId: string;
  boundingBox: FaceBoundingBox;
  qualityScore: number;
}

export abstract class FaceRecognitionService {
  /**
   * Detect all faces in the given image buffer.
   * Returns all detected faces with bounding boxes and quality scores.
   */
  abstract detectFaces(imageBuffer: Buffer): Promise<DetectedFace[]>;

  /**
   * Evaluate the quality of a detected face for recognition purposes.
   */
  abstract validateFaceQuality(face: DetectedFace): FaceQualityResult;

  /**
   * Index a face image into the event's face collection.
   * For Rekognition, this adds the face to a named Collection.
   * Returns an external face ID that can be stored in the DB.
   *
   * This replaces the embedding approach for Rekognition (which manages embeddings internally).
   * For providers that return raw embeddings, store them in face_embeddings table.
   */
  abstract indexFace(
    imageBuffer: Buffer,
    face: DetectedFace,
    eventCollectionId: string,
  ): Promise<IndexFaceResult>;

  /**
   * Search for a face within a specific event's collection.
   * MUST always be called with a valid eventCollectionId.
   * Never searches globally across all events.
   */
  abstract searchFaces(
    imageBuffer: Buffer,
    eventCollectionId: string,
    options?: { maxResults?: number; minSimilarity?: number },
  ): Promise<FaceSearchMatch[]>;

  /**
   * Create a collection for a new event.
   * Rekognition requires creating a Collection before indexing faces.
   */
  abstract createEventCollection(eventCollectionId: string): Promise<void>;

  /**
   * Delete an event's entire face collection.
   * Called when an event is deleted or when face data retention expires.
   */
  abstract deleteEventCollection(eventCollectionId: string): Promise<void>;

  /**
   * Delete a specific face from an event's collection.
   * Called when a guest requests face data deletion.
   */
  abstract deleteFace(eventCollectionId: string, externalFaceId: string): Promise<void>;

  /**
   * Health check — verify the face recognition service is reachable.
   */
  abstract healthCheck(): Promise<{ healthy: boolean; latencyMs: number }>;

  /**
   * Derive a stable, unique collection ID for an event.
   * Must not contain personally identifiable information.
   */
  protected getEventCollectionId(eventId: string): string {
    const prefix = process.env['REKOGNITION_COLLECTION_PREFIX'] ?? 'lensrecall';
    return `${prefix}_${eventId}`;
  }
}
