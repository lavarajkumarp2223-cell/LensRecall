import { Injectable, Logger } from '@nestjs/common';
import {
  FaceRecognitionService,
  DetectedFace,
  FaceQualityResult,
  FaceSearchMatch,
  IndexFaceResult,
} from './face-recognition.service.js';
import { randomUUID } from 'node:crypto';

/**
 * MockFaceRecognitionAdapter — Development-only fake face recognition.
 *
 * ⚠️  THIS IS NEVER FOR PRODUCTION USE ⚠️
 *
 * This adapter does NOT perform real face recognition.
 * It returns deterministic fake results suitable for UI development.
 *
 * It is clearly labeled and BLOCKED in production environments.
 *
 * How it works in development:
 * - detectFaces: always returns 1 fake face in the center of the image
 * - indexFace: stores a fake UUID as the external face ID
 * - searchFaces: returns all faces in the event collection with fake similarity scores
 *
 * This allows photographers to upload, the UI to show "faces detected",
 * and guests to go through the full flow — without real AI.
 */
@Injectable()
export class MockFaceRecognitionAdapter extends FaceRecognitionService {
  private readonly logger = new Logger(MockFaceRecognitionAdapter.name);
  // In-memory collection: collectionId -> Set<faceId>
  private readonly collections = new Map<string, Set<string>>();

  constructor() {
    super();

    if (process.env['NODE_ENV'] === 'production') {
      throw new Error(
        '🚨 CRITICAL: MockFaceRecognitionAdapter cannot be used in production. ' +
          'Set FACE_RECOGNITION_PROVIDER=rekognition and configure AWS credentials.',
      );
    }

    this.logger.warn(
      '⚠️  MockFaceRecognitionAdapter is active. ' +
        'Face recognition is SIMULATED. Results are NOT real. ' +
        'This is DEVELOPMENT ONLY.',
    );
  }

  async detectFaces(_imageBuffer: Buffer): Promise<DetectedFace[]> {
    // Simulate processing time
    await this.sleep(200);

    // Always detect one face in the center for development
    return [
      {
        boundingBox: { left: 0.3, top: 0.2, width: 0.4, height: 0.5 },
        confidence: 0.99,
        qualityScore: 0.85,
      },
    ];
  }

  validateFaceQuality(face: DetectedFace): FaceQualityResult {
    return { isUsable: face.qualityScore >= 0.5, qualityScore: face.qualityScore };
  }

  async indexFace(
    _imageBuffer: Buffer,
    face: DetectedFace,
    eventCollectionId: string,
  ): Promise<IndexFaceResult> {
    await this.sleep(100);

    const faceId = randomUUID();

    if (!this.collections.has(eventCollectionId)) {
      this.collections.set(eventCollectionId, new Set());
    }
    this.collections.get(eventCollectionId)!.add(faceId);

    this.logger.debug(`[MOCK] Indexed face ${faceId} in collection ${eventCollectionId}`);

    return {
      externalFaceId: faceId,
      boundingBox: face.boundingBox,
      qualityScore: face.qualityScore,
    };
  }

  async searchFaces(
    _imageBuffer: Buffer,
    eventCollectionId: string,
    options?: { maxResults?: number },
  ): Promise<FaceSearchMatch[]> {
    await this.sleep(300);

    const collection = this.collections.get(eventCollectionId);
    if (!collection || collection.size === 0) {
      this.logger.debug(`[MOCK] No faces in collection ${eventCollectionId}`);
      return [];
    }

    const maxResults = options?.maxResults ?? 20;
    const faceIds = Array.from(collection).slice(0, maxResults);

    // Return all faces with varying fake similarity scores
    return faceIds.map((faceId) => ({
      externalFaceId: faceId,
      similarityScore: 0.75 + Math.random() * 0.25, // 0.75-1.0 range
    }));
  }

  async createEventCollection(eventCollectionId: string): Promise<void> {
    this.collections.set(eventCollectionId, new Set());
    this.logger.debug(`[MOCK] Created collection ${eventCollectionId}`);
  }

  async deleteEventCollection(eventCollectionId: string): Promise<void> {
    this.collections.delete(eventCollectionId);
    this.logger.debug(`[MOCK] Deleted collection ${eventCollectionId}`);
  }

  async deleteFace(eventCollectionId: string, externalFaceId: string): Promise<void> {
    this.collections.get(eventCollectionId)?.delete(externalFaceId);
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    await this.sleep(10);
    return { healthy: true, latencyMs: 10 };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
