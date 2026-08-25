import { NextResponse } from 'next/server';
import {
  RekognitionClient,
  CompareFacesCommand,
} from '@aws-sdk/client-rekognition';

// AWS Rekognition Client reading strictly from environment variables
const region = process.env.AWS_REGION || process.env.REKOGNITION_REGION || 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.REKOGNITION_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.REKOGNITION_SECRET_ACCESS_KEY || '';

const rekognition = new RekognitionClient({
  region,
  ...(accessKeyId && secretAccessKey
    ? {
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      }
    : {}),
});

function dataUrlToBuffer(dataUrl: string): Buffer | null {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const base64Str = parts[1];
    if (!base64Str) return null;
    return Buffer.from(base64Str, 'base64');
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { selfie, photos, threshold = 80 } = body;

    if (!selfie || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const selfieBuffer = dataUrlToBuffer(selfie);
    if (!selfieBuffer) {
      return NextResponse.json({ matches: [] });
    }

    const matchedPhotos: Array<any & { matchScore: number; isMatch: boolean }> = [];

    // Compare selfie against each photo using Amazon Rekognition
    for (const photo of photos) {
      const photoUrl = photo.url || photo.thumbnailUrl;
      if (!photoUrl) continue;

      const targetBuffer = dataUrlToBuffer(photoUrl);
      if (!targetBuffer) continue;

      try {
        const command = new CompareFacesCommand({
          SourceImage: { Bytes: selfieBuffer },
          TargetImage: { Bytes: targetBuffer },
          SimilarityThreshold: threshold,
        });

        const response = await rekognition.send(command);

        if (response.FaceMatches && response.FaceMatches.length > 0) {
          const topMatch = response.FaceMatches[0];
          const similarity = topMatch?.Similarity ? +topMatch.Similarity.toFixed(1) : 95.0;

          matchedPhotos.push({
            ...photo,
            matchScore: similarity,
            isMatch: true,
          });
        }
      } catch (err: any) {
        // If Rekognition found 0 faces in target (e.g. wallpaper / landscape) or face mismatch, it throws or returns 0 matches
        console.warn(`[Rekognition CompareFaces] Photo ${photo.id}: ${err.message || 'No match'}`);
      }
    }

    // Sort matching photos by highest AWS Rekognition similarity score
    matchedPhotos.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      success: true,
      matches: matchedPhotos,
      count: matchedPhotos.length,
    });
  } catch (error: any) {
    console.error('[API face-match error]:', error);
    return NextResponse.json({ success: false, matches: [] }, { status: 500 });
  }
}
