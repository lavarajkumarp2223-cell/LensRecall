# LensRecall — Architecture

## Overview

LensRecall is a multi-tenant SaaS platform for AI-powered event photo discovery. The architecture is built around:

1. **Strong tenant isolation** — every query explicitly scoped by organization_id / event_id
2. **Replaceable providers** — storage, face recognition, notifications, and payments are all behind abstract interfaces
3. **Asynchronous processing** — all media processing happens in background workers via BullMQ
4. **Privacy by design** — face embeddings never leave the server, biometric data has configurable retention

## System Components

```
                          ┌────────────────────────────────────────────────┐
                          │              CLIENTS                            │
                          │  Browser (Organizer/Photographer/Admin/Guest)   │
                          └─────────────────┬──────────────────────────────┘
                                            │ HTTPS
                          ┌─────────────────▼──────────────────────────────┐
                          │           Next.js Frontend (apps/web)           │
                          │  Marketing / Dashboards / Guest flow            │
                          └─────────────────┬──────────────────────────────┘
                                            │ REST API
                          ┌─────────────────▼──────────────────────────────┐
                          │           NestJS API (apps/api)                 │
                          │  Auth / Events / Photos / Face Search / ...     │
                          └────┬───────────┬────────────────────────────────┘
                               │           │
              ┌────────────────▼──┐  ┌─────▼────────────────────────────────┐
              │   PostgreSQL 16   │  │           Redis                        │
              │   + pgvector      │  │   BullMQ queue / session cache         │
              └───────────────────┘  └─────┬────────────────────────────────┘
                                           │
                          ┌────────────────▼──────────────────────────────┐
                          │           BullMQ Workers (apps/worker)         │
                          │  ImageProcessor / FaceDetection / Download     │
                          └─────┬────────────────────┬─────────────────────┘
                                │                    │
              ┌─────────────────▼──┐  ┌─────────────▼──────────────────────┐
              │  Object Storage    │  │  Face Recognition Service            │
              │  (Cloudflare R2)   │  │  (AWS Rekognition)                   │
              └────────────────────┘  └────────────────────────────────────┘
```

## Data Flow: Photo Upload → Face Indexing

```
Photographer → Direct upload (presigned URL) → Cloudflare R2
                                                    ↓
API: POST /uploads/confirm → Creates Photo record (UPLOADED)
                                                    ↓
                              Enqueues: image-processing job (BullMQ)
                                                    ↓
Worker: ImageProcessor
  ├── Download original from R2
  ├── Generate thumbnail (300px WebP) → R2
  ├── Generate preview (1920px WebP) → R2
  ├── Update Photo: width, height, storage keys
  └── Enqueue: face-detection job
                                                    ↓
Worker: FaceDetectionProcessor
  ├── Download image from R2
  ├── AWS Rekognition: DetectFaces
  ├── Validate face quality
  ├── Insert photo_faces records
  └── Enqueue: face-embedding jobs (one per face)
                                                    ↓
Worker: FaceEmbeddingProcessor
  ├── AWS Rekognition: IndexFaces (into event collection)
  ├── Store external_face_id in photo_faces
  └── When all faces indexed: Photo status → READY
```

## Data Flow: Guest Face Search

```
Guest camera capture (browser)
          ↓
POST /api/events/:token/face-search (multipart/form-data)
  ├── Validate event-scoped JWT
  ├── Validate consent record exists
  ├── AWS Rekognition: SearchFacesByImage(eventCollectionId)
  │   └── ALWAYS filtered to one event collection
  ├── Map externalFaceId → photo_face_id → photo_id
  ├── Authorization check (guest session valid, event active)
  ├── Generate signed thumbnail URLs (TTL: 1 hour)
  ├── Audit log: FACE_SEARCH_PERFORMED
  └── Return: { totalFound, photos: [{thumbnailUrl, previewUrl}] }
          ↓
Guest sees personal gallery — thumbnails only initially
Clicking photo → signed previewUrl (higher quality)
Downloading → signed original URL or ZIP job
```

## Module Boundaries

Each NestJS module owns its routes, service, and direct DB access. Cross-module communication via service injection.

| Module | Owns | Never Does |
|---|---|---|
| auth | JWT generation, validation | Photo operations |
| events | Event CRUD, privacy settings | Face search |
| uploads | Presigned URL generation | Image processing |
| processing | Job queue, job status | Face matching |
| face-detection | FaceRecognitionService calls | Direct DB writes to non-face tables |
| vector-search | pgvector queries | Cross-event queries (enforced) |
| gallery | Result assembly, URL signing | Raw embedding access |
| downloads | ZIP job creation | Storage key exposure |
| privacy | Consent, deletion requests | Photo serving |
| audit | Append-only log writes | Log reads (admin only) |

## Provider Interfaces

All external services are accessed through abstract classes.
Concrete adapters are selected at startup by environment variable.

```
StorageService (abstract)
├── R2StorageAdapter [STORAGE_PROVIDER=r2]
├── S3StorageAdapter [STORAGE_PROVIDER=s3]  (future)
└── MockStorageAdapter [STORAGE_PROVIDER=mock]  ⚠️ dev only

FaceRecognitionService (abstract)
├── RekognitionAdapter [FACE_RECOGNITION_PROVIDER=rekognition]
├── AzureFaceAdapter [FACE_RECOGNITION_PROVIDER=azure]  (future)
└── MockFaceRecognitionAdapter [FACE_RECOGNITION_PROVIDER=mock]  ⚠️ dev only

NotificationService (abstract)
├── ResendEmailAdapter [EMAIL_PROVIDER=resend]
└── inline mock [EMAIL_PROVIDER=mock]

PaymentService (abstract)
├── StripePaymentAdapter [PAYMENT_PROVIDER=stripe]  (Phase 8)
└── MockPaymentAdapter [PAYMENT_PROVIDER=mock]
```

## Multi-Tenant Isolation

Every database query that returns user-visible data MUST include:

```typescript
// Wrong — returns all events
await db.query.events.findMany();

// Correct — organization-scoped
await db.query.events.findMany({
  where: eq(events.organizationId, currentUser.organizationId)
});
```

Authorization is enforced server-side via NestJS guards, not just frontend route protection.

## Security Architecture

| Threat | Mitigation |
|---|---|
| Cross-tenant data leak | Every query scoped by org/event ID |
| Face search across events | eventCollectionId hardcoded per event |
| Raw embedding exposure | Embeddings managed by Rekognition, never returned via API |
| Storage key exposure | Signed URLs only, keys never in API responses |
| QR enumeration | Opaque random tokens, not sequential IDs |
| Mass upload | Rate limiting + file size limits |
| Brute force | Per-route throttling, bcrypt for passwords |
| CSRF | SameSite cookies + CORS |
| File injection | MIME validation server-side (Sharp validates) |

## Scalability

- API servers are stateless — scale horizontally
- Workers scale independently (concurrency per worker type via env var)
- Media served from R2 + CDN — no load on API servers
- Face collections partitioned per event in Rekognition — no global search
- pgvector index (ivfflat) for fast approximate NN search
- Pagination on all list endpoints
