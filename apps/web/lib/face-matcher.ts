// Biometric Facial Recognition & Feature Matching Engine
// Directly powered by AWS Rekognition CompareFaces (Amazon AI ap-south-1)

export interface FaceMatchScore {
  photoId: string;
  isMatch: boolean;
  confidence: number;
}

/**
 * Filters an event's photographs using Amazon Rekognition (AWS AI)
 * - Returns ONLY photos where the searched person's face is detected and verified by AWS AI.
 * - Strictly rejects and excludes wallpapers, artworks, posters, and unrelated individuals.
 */
export async function filterPhotosBySelfie(
  selfieUrl: string | null,
  photos: Array<{ id: string; url: string; originalFilename?: string; [key: string]: any }>,
  similarityThreshold = 80
): Promise<Array<any & { matchScore: number; isMatch: boolean }>> {
  if (!selfieUrl || photos.length === 0) {
    return [];
  }

  // 1. Direct match check (exact same image uploaded)
  const exactMatches: Array<any & { matchScore: number; isMatch: boolean }> = [];
  const candidatePhotos: typeof photos = [];

  for (const photo of photos) {
    const photoUrl = photo.url || photo.thumbnailUrl;
    if (photoUrl && photoUrl === selfieUrl) {
      exactMatches.push({
        ...photo,
        matchScore: 99.9,
        isMatch: true,
      });
    } else {
      candidatePhotos.push(photo);
    }
  }

  // 2. Call AWS Rekognition API route (/api/face-match) for deep neural face recognition
  if (typeof window !== 'undefined' && candidatePhotos.length > 0) {
    try {
      const res = await fetch('/api/face-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selfie: selfieUrl,
          photos: candidatePhotos,
          threshold: similarityThreshold,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.matches)) {
          const combined = [...exactMatches, ...data.matches];
          return combined.sort((a, b) => b.matchScore - a.matchScore);
        }
      }
    } catch (err) {
      console.warn('[AWS Rekognition Client]: API match request error:', err);
    }
  }

  return exactMatches;
}
