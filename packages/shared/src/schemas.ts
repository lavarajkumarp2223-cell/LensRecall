import { z } from 'zod';
import { EventType, AuthProvider } from './types.js';

// ─── Auth ──────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const MagicLinkSchema = z.object({
  email: z.string().email(),
});

// ─── Organizations ─────────────────────────────────────────────────────────

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
});

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();

export const InviteOrganizationMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']),
});

// ─── Events ────────────────────────────────────────────────────────────────

export const CreateEventSchema = z.object({
  name: z.string().min(2).max(200),
  eventType: z.nativeEnum(EventType),
  description: z.string().max(2000).optional(),
  venue: z.string().max(500).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  timezone: z.string().min(1), // e.g. "Asia/Kolkata"
  privacySettings: z
    .object({
      requireAuthentication: z.boolean().default(true),
      requireConsent: z.boolean().default(true),
      allowPhotoDownload: z.boolean().default(true),
      allowPhotoSharing: z.boolean().default(false),
      guestGalleryExpiryDays: z.number().int().positive().nullable().default(null),
    })
    .optional(),
  retentionSettings: z
    .object({
      faceDataRetentionDays: z.number().int().positive().default(90),
      photoRetentionDays: z.number().int().positive().nullable().default(null),
    })
    .optional(),
});

export const UpdateEventSchema = CreateEventSchema.partial();

// ─── Albums ────────────────────────────────────────────────────────────────

export const CreateAlbumSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const UpdateAlbumSchema = CreateAlbumSchema.partial();

// ─── Uploads ───────────────────────────────────────────────────────────────

export const RequestUploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']),
  fileSize: z.number().int().positive().max(52_428_800), // 50 MB
  checksum: z.string().min(1), // SHA-256 hex
  albumId: z.string().uuid().optional(),
});

export const PresignedUploadUrlRequestSchema = z.object({
  files: z.array(
    z.object({
      filename: z.string().min(1).max(255),
      mimeType: z.string().min(1),
      sizeBytes: z.number().int().positive(),
      albumId: z.string().uuid().optional(),
    }),
  ).min(1).max(100),
});

export const ConfirmUploadSchema = z.object({
  photoId: z.string().uuid(),
  checksum: z.string().min(1),
});

export const BulkConfirmUploadSchema = z.object({
  uploads: z.array(ConfirmUploadSchema).min(1).max(100),
});

export const ConfirmUploadBatchSchema = BulkConfirmUploadSchema;

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  phone: z.string().optional(),
});

// ─── QR Codes ──────────────────────────────────────────────────────────────

export const CreateQrCodeSchema = z.object({
  label: z.string().max(100).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const GenerateQrCodeSchema = CreateQrCodeSchema;

// ─── Guest / Face Search ───────────────────────────────────────────────────

export const GuestAuthSchema = z.object({
  provider: z.nativeEnum(AuthProvider),
  eventToken: z.string().min(1),
});

export const ConsentSchema = z.object({
  eventId: z.string().uuid(),
  policyVersion: z.string().min(1),
  granted: z.literal(true), // must be explicitly true
});

export const FaceSearchSchema = z.object({
  eventToken: z.string().min(1),
  // imageData is sent as FormData (multipart), not JSON
});

// ─── Downloads ─────────────────────────────────────────────────────────────

export const CreateDownloadJobSchema = z.object({
  photoIds: z.array(z.string().uuid()).min(1).max(500),
});

// ─── Privacy Requests ──────────────────────────────────────────────────────

export const CreatePrivacyRequestSchema = z.object({
  requestType: z.enum(['ACCESS', 'DELETION', 'CORRECTION', 'CONSENT_WITHDRAWAL']),
  eventId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

// ─── Pagination ────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const CursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ─── Inferred Types ────────────────────────────────────────────────────────

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type MagicLinkDto = z.infer<typeof MagicLinkSchema>;
export type CreateOrganizationDto = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationSchema>;
export type InviteOrganizationMemberDto = z.infer<typeof InviteOrganizationMemberSchema>;
export type CreateEventDto = z.infer<typeof CreateEventSchema>;
export type UpdateEventDto = z.infer<typeof UpdateEventSchema>;
export type CreateAlbumDto = z.infer<typeof CreateAlbumSchema>;
export type UpdateAlbumDto = z.infer<typeof UpdateAlbumSchema>;
export type RequestUploadUrlDto = z.infer<typeof RequestUploadUrlSchema>;
export type ConfirmUploadDto = z.infer<typeof ConfirmUploadSchema>;
export type BulkConfirmUploadDto = z.infer<typeof BulkConfirmUploadSchema>;
export type CreateQrCodeDto = z.infer<typeof CreateQrCodeSchema>;
export type ConsentDto = z.infer<typeof ConsentSchema>;
export type CreateDownloadJobDto = z.infer<typeof CreateDownloadJobSchema>;
export type CreatePrivacyRequestDto = z.infer<typeof CreatePrivacyRequestSchema>;
export type PaginationDto = z.infer<typeof PaginationSchema>;
export type CursorPaginationDto = z.infer<typeof CursorPaginationSchema>;
