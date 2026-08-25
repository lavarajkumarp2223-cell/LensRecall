# LensRecall

> **Find every moment you're in.**

AI-powered event photo discovery platform. Photographers upload event photos, guests scan a QR code, capture their face through the camera, and instantly find every photo they appear in — scoped entirely to that event.

---

## Architecture

```
lensrecall/
├── apps/
│   ├── web/       # Next.js 15 frontend (marketing, dashboards, guest flow)
│   ├── api/       # NestJS backend
│   └── worker/    # BullMQ background workers (image processing, face AI)
├── packages/
│   ├── db/        # Drizzle ORM schema, migrations, seed data
│   ├── shared/    # Types, Zod schemas, constants (used by all apps)
│   └── config/    # Shared TypeScript and lint configs
└── docs/          # Architecture, API, Security, Privacy documentation
```

## Quick Start (Development)

### Prerequisites
- Node.js ≥ 20
- Docker Desktop (for PostgreSQL, Redis, MinIO)

### 1. Clone and install
```bash
git clone <repo>
cd lensrecall
npm install
```

### 2. Configure environment
```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
# Edit with your local values
```

### 3. Start local infrastructure
```bash
docker compose up -d
# Starts: PostgreSQL 16 + pgvector, Redis 7, MinIO
```

### 4. Run database migrations
```bash
npm run db:migrate -w packages/db
```

### 5. Seed development data
```bash
npm run db:seed -w packages/db
```

### 6. Start development servers
```bash
npm run dev
# Starts: web (localhost:3000), api (localhost:3001), worker
```

## Key URLs
- **Marketing site**: http://localhost:3000
- **API docs (Swagger)**: http://localhost:3001/api/docs
- **MinIO console**: http://localhost:9001 (minioadmin / minioadmin123)

## Documentation
- [Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE.md)
- [API Reference](docs/API.md)
- [Security](docs/SECURITY.md)
- [AI / Face Recognition](docs/AI.md)
- [Storage](docs/STORAGE.md)
- [Privacy](docs/PRIVACY.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Environment Variables](docs/ENVIRONMENT.md)
- [Testing](docs/TESTING.md)

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| Backend | NestJS, Node.js, TypeScript |
| Database | PostgreSQL 16 + pgvector |
| ORM | Drizzle ORM |
| Queue | BullMQ + Redis |
| Object Storage | Cloudflare R2 (S3-compatible) |
| Face Recognition | AWS Rekognition |
| Auth | Auth.js v5 (NextAuth) |
| Image Processing | Sharp |
| Monorepo | Turborepo + npm workspaces |

## Roles
- **Super Admin** — platform administration
- **Organizer** — creates and manages events
- **Photographer** — uploads and manages photos
- **Guest** — scans QR, finds their photos

## Current Phase
**Phase 0 — Architecture** ✅

Next: **Phase 1 — Foundation** (Authentication, Users, Organizations, RBAC)
