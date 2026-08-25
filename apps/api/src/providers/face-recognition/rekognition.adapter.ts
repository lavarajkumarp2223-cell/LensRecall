import {
  RekognitionClient,
  DetectFacesCommand,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  CreateCollectionCommand,
  DeleteCollectionCommand,
  DeleteFacesCommand,
  Attribute,
  QualityFilter,
} from '@aws-sdk/client-rekognition';
import { Injectable, Logger } from '@nestjs/common';
import {
  FaceRecognitionService,
  DetectedFace,
  FaceQualityResult,
  FaceSearchMatch,
  IndexFaceResult,
} from './face-recognition.service.js';

/**
 * RekognitionAdapter — AWS Rekognition implementation.
 *
 * Rekognition manages face embeddings internally inside "Collections".
 * We create one Collection per event and search within it.
 *
 * Env vars:
 * - REKOGNITION_REGION (e.g. ap-south-1)
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - REKOGNITION_COLLECTION_PREFIX (e.g. "lensrecall")
 * - FACE_SIMILARITY_THRESHOLD (0-100, default 80)
 * - FACE_MAX_RESULTS (default 100)
 */
@Injectable()
export class RekognitionAdapter extends FaceRecognitionService {
  private readonly logger = new Logger(RekognitionAdapter.name);
  private readonly client: RekognitionClient;
  private readonly similarityThreshold: number;
  private readonly maxResults: number;

  constructor() {
    super();

    const clientConfig: any = {
      region: process.env['REKOGNITION_REGION'] ?? process.env['AWS_REGION'] ?? 'ap-south-1',
    };

    if (process.env['REKOGNITION_ACCESS_KEY_ID']) {
      clientConfig.credentials = {
        accessKeyId: process.env['REKOGNITION_ACCESS_KEY_ID'] ?? '',
        secretAccessKey: process.env['REKOGNITION_SECRET_ACCESS_KEY'] ?? '',
      };
    }

    this.client = new RekognitionClient(clientConfig);

    this.similarityThreshold = parseInt(
      process.env['FACE_SIMILARITY_THRESHOLD'] ?? '80',
      10,
    );
    this.maxResults = parseInt(process.env['FACE_MAX_RESULTS'] ?? '100', 10);
  }

  async detectFaces(imageBuffer: Buffer): Promise<DetectedFace[]> {
    const response = await this.client.send(
      new DetectFacesCommand({
        Image: { Bytes: imageBuffer },
        Attributes: [Attribute.DEFAULT],
      }),
    );

    if (!response.FaceDetails || response.FaceDetails.length === 0) {
      return [];
    }

    return response.FaceDetails.map((face) => ({
      boundingBox: {
        left: face.BoundingBox?.Left ?? 0,
        top: face.BoundingBox?.Top ?? 0,
        width: face.BoundingBox?.Width ?? 0,
        height: face.BoundingBox?.Height ?? 0,
      },
      confidence: (face.Confidence ?? 0) / 100,
      qualityScore: this.computeQualityScore(face),
      landmarks: face.Landmarks
        ? face.Landmarks.map((l) => ({
            type: l.Type ?? 'unknown',
            x: l.X ?? 0,
            y: l.Y ?? 0,
          }))
        : undefined,
    }));
  }

  validateFaceQuality(face: DetectedFace): FaceQualityResult {
    const MIN_QUALITY = parseFloat(process.env['MIN_FACE_QUALITY_SCORE'] ?? '0.5');
    const MIN_FACE_SIZE = 0.05; // 5% of image dimension

    if (face.qualityScore < MIN_QUALITY) {
      return {
        isUsable: false,
        reason: 'QUALITY_TOO_LOW',
        qualityScore: face.qualityScore,
      };
    }

    if (face.boundingBox.width < MIN_FACE_SIZE || face.boundingBox.height < MIN_FACE_SIZE) {
      return {
        isUsable: false,
        reason: 'FACE_TOO_SMALL',
        qualityScore: face.qualityScore,
      };
    }

    return { isUsable: true, qualityScore: face.qualityScore };
  }

  async indexFace(
    imageBuffer: Buffer,
    face: DetectedFace,
    eventCollectionId: string,
  ): Promise<IndexFaceResult> {
    const response = await this.client.send(
      new IndexFacesCommand({
        CollectionId: eventCollectionId,
        Image: { Bytes: imageBuffer },
        MaxFaces: 1, // Index only the specified face
        QualityFilter: QualityFilter.AUTO,
        DetectionAttributes: [Attribute.DEFAULT],
      }),
    );

    const indexedFace = response.FaceRecords?.[0];
    if (!indexedFace?.Face?.FaceId) {
      throw new Error(`Rekognition failed to index face in collection ${eventCollectionId}`);
    }

    return {
      externalFaceId: indexedFace.Face.FaceId,
      boundingBox: face.boundingBox,
      qualityScore: face.qualityScore,
    };
  }

  async searchFaces(
    imageBuffer: Buffer,
    eventCollectionId: string,
    options?: { maxResults?: number; minSimilarity?: number },
  ): Promise<FaceSearchMatch[]> {
    const threshold = options?.minSimilarity ?? this.similarityThreshold;
    const maxResults = options?.maxResults ?? this.maxResults;

    try {
      const response = await this.client.send(
        new SearchFacesByImageCommand({
          CollectionId: eventCollectionId,
          Image: { Bytes: imageBuffer },
          FaceMatchThreshold: threshold,
          MaxFaces: maxResults,
          QualityFilter: QualityFilter.AUTO,
        }),
      );

      if (!response.FaceMatches || response.FaceMatches.length === 0) {
        return [];
      }

      return response.FaceMatches.flatMap((match) => {
        if (!match.Face?.FaceId) return [];
        return [
          {
            externalFaceId: match.Face.FaceId,
            similarityScore: (match.Similarity ?? 0) / 100, // Normalize to 0-1
          },
        ];
      });
    } catch (error) {
      const err = error as { name?: string; message?: string };

      // Collection doesn't exist yet (no photos indexed for this event)
      if (err.name === 'ResourceNotFoundException') {
        this.logger.warn(
          `Collection ${eventCollectionId} not found in Rekognition — returning 0 matches`,
        );
        return [];
      }

      // No face detected in query selfie
      if (err.name === 'InvalidParameterException' && err.message?.includes('no faces')) {
        this.logger.warn('No face found in guest query selfie');
        return [];
      }

      this.logger.error(`Rekognition search error: ${err.message}`, error);
      throw error;
    }
  }

  async createEventCollection(eventCollectionId: string): Promise<void> {
    try {
      await this.client.send(
        new CreateCollectionCommand({
          CollectionId: eventCollectionId,
          Tags: {
            Service: 'LensRecall',
            Environment: process.env['NODE_ENV'] ?? 'development',
          },
        }),
      );
      this.logger.log(`Created Rekognition collection: ${eventCollectionId}`);
    } catch (error) {
      const err = error as { name?: string };
      // Idempotent: already exists is fine
      if (err.name === 'ResourceAlreadyExistsException') {
        this.logger.debug(`Collection ${eventCollectionId} already exists`);
        return;
      }
      throw error;
    }
  }

  async deleteEventCollection(eventCollectionId: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteCollectionCommand({ CollectionId: eventCollectionId }),
      );
      this.logger.log(`Deleted Rekognition collection: ${eventCollectionId}`);
    } catch (error) {
      const err = error as { name?: string };
      if (err.name === 'ResourceNotFoundException') {
        this.logger.warn(`Collection not found (already deleted?): ${eventCollectionId}`);
        return;
      }
      throw error;
    }
  }

  async deleteFace(eventCollectionId: string, externalFaceId: string): Promise<void> {
    await this.client.send(
      new DeleteFacesCommand({
        CollectionId: eventCollectionId,
        FaceIds: [externalFaceId],
      }),
    );
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.client.send(new DetectFacesCommand({
        Image: {
          Bytes: Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=', 'base64'),
        },
        Attributes: [],
      }));
      return { healthy: true, latencyMs: Date.now() - start };
    } catch {
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }

  private computeQualityScore(face: any): number {
    const sharpness = (face.Quality?.Sharpness ?? 0) / 100;
    const brightness = (face.Quality?.Brightness ?? 0) / 100;
    const confidence = (face.Confidence ?? 0) / 100;

    return sharpness * 0.4 + brightness * 0.2 + confidence * 0.4;
  }
}
