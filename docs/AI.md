# LensRecall — AI & Face Recognition

## Overview

LensRecall uses facial recognition to match event photos to guests. The AI layer is fully abstracted — the core application never knows which face recognition provider is in use.

## Provider: AWS Rekognition (Initial)

AWS Rekognition is used as the initial face recognition provider because:
- Managed service — no model hosting required
- Pay-per-use pricing (no upfront GPU cost)
- High accuracy for the use case
- Available in `ap-south-1` for India-based events

### How Rekognition Collections Work

Rekognition organizes faces into **Collections** — server-side indexes of face embeddings.

LensRecall creates one Collection per event:
```
Collection ID: lensrecall_{eventId}
```

This is the primary mechanism for event isolation — searching a collection only returns faces indexed into that collection.

**Rekognition API calls used:**

| Operation | When |
|---|---|
| `CreateCollection` | Event created |
| `IndexFaces` | Photo processing — index each detected face |
| `SearchFacesByImage` | Guest face search |
| `DeleteFaces` | Guest requests face data deletion |
| `DeleteCollection` | Event deletion or retention expiry |

### Embedding Security

With AWS Rekognition:
- **Embeddings are managed entirely by AWS** — they never leave Rekognition's storage
- LensRecall only stores the `externalFaceId` (Rekognition's FaceId UUID)
- The `externalFaceId` has no biometric information by itself
- Deleting a face from the collection (`DeleteFaces`) removes the embedding from AWS

This means there are **no raw floating-point embeddings stored in our database**.

The `face_embeddings` table (with pgvector) exists for future providers that return raw embeddings — it is not used by the Rekognition adapter.

## Switching Providers

To switch from Rekognition to another provider (e.g., Azure Face API or a self-hosted model):

1. Create a new class extending `FaceRecognitionService`
2. Implement all 7 abstract methods
3. Add a case in `FaceRecognitionProviderModule`
4. Set `FACE_RECOGNITION_PROVIDER=yourprovider` in environment

No business logic changes required.

## Mock Adapter

During development, `MockFaceRecognitionAdapter` is used:
- Always returns 1 fake face detected
- Returns all indexed faces as search results with random scores
- Stores fake UUIDs as face IDs (in memory only)
- **Blocked in production** — throws on startup if `NODE_ENV=production`

```
⚠️  MockFaceRecognitionAdapter is active. Face recognition is SIMULATED. 
Results are NOT real. This is DEVELOPMENT ONLY.
```

## Face Quality Validation

Before indexing a face, LensRecall validates:
1. **Quality score** — composite of sharpness, brightness, and confidence (min: 0.5)
2. **Face size** — must be at least 5% of image dimension (too small = unusable)
3. **Single face** — for guest capture, only 1 face is acceptable

Poor quality faces are skipped in the processing pipeline. The photo still becomes READY — it just has fewer indexed faces.

## Similarity Threshold

Configurable via `FACE_SIMILARITY_THRESHOLD` (0-100 for Rekognition, min recommended: 75).

Default: **80**

Lower threshold = more results but more false positives.
Higher threshold = fewer results but higher precision.

Organizers cannot change this per-event in the MVP — it's a platform-level setting.

## Future AI Features (Not in MVP)

The architecture is designed to support:
- Photo quality scoring
- Smart album generation
- Duplicate detection
- Best-shot selection
- Group photo detection
- Speaker recognition for conferences

None of these should be implemented prematurely.
