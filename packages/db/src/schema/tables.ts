import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// ─── Enums ─────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', [
  'SUPER_ADMIN',
  'ORGANIZER',
  'PHOTOGRAPHER',
  'GUEST',
]);

export const userStatusEnum = pgEnum('user_status', [
  'ACTIVE',
  'SUSPENDED',
  'PENDING_VERIFICATION',
  'DELETED',
]);

export const authProviderEnum = pgEnum('auth_provider', ['GOOGLE', 'EMAIL', 'PHONE']);

// ─── Users ─────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    phone: varchar('phone', { length: 20 }),
    phoneVerified: boolean('phone_verified').default(false).notNull(),
    avatarUrl: text('avatar_url'),
    authProvider: authProviderEnum('auth_provider').notNull(),
    // For email/password auth (hashed — NEVER plaintext)
    passwordHash: text('password_hash'),
    role: userRoleEnum('role').notNull().default('ORGANIZER'),
    status: userStatusEnum('status').notNull().default('PENDING_VERIFICATION'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('users_email_idx').on(t.email),
    index('users_status_idx').on(t.status),
  ],
);

// ─── Organizations ─────────────────────────────────────────────────────────

export const orgStatusEnum = pgEnum('org_status', ['ACTIVE', 'SUSPENDED', 'DELETED']);

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 50 }).notNull(),
    logoUrl: text('logo_url'),
    brandingSettings: jsonb('branding_settings')
      .$type<{
        primaryColor?: string;
        accentColor?: string;
        customDomain?: string | null;
      }>()
      .default({}),
    status: orgStatusEnum('status').notNull().default('ACTIVE'),
    planId: uuid('plan_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('organizations_slug_idx').on(t.slug)],
);

// ─── Organization Members ──────────────────────────────────────────────────

export const orgMemberRoleEnum = pgEnum('org_member_role', ['OWNER', 'ADMIN', 'MEMBER']);

export const organizationMembers = pgTable(
  'organization_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: orgMemberRoleEnum('role').notNull().default('MEMBER'),
    invitedByUserId: uuid('invited_by_user_id').references(() => users.id),
    invitedAt: timestamp('invited_at', { withTimezone: true }).defaultNow().notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('org_members_org_user_idx').on(t.organizationId, t.userId),
    index('org_members_org_idx').on(t.organizationId),
  ],
);

// ─── Events ────────────────────────────────────────────────────────────────

export const eventTypeEnum = pgEnum('event_type', [
  'WEDDING',
  'ENGAGEMENT',
  'RECEPTION',
  'BIRTHDAY',
  'ANNIVERSARY',
  'CORPORATE',
  'CONFERENCE',
  'COLLEGE',
  'FESTIVAL',
  'CONCERT',
  'SPORTS',
  'PRIVATE',
  'OTHER',
]);

export const eventStatusEnum = pgEnum('event_status', [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'ARCHIVED',
  'DELETED',
]);

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    eventType: eventTypeEnum('event_type').notNull(),
    description: text('description'),
    coverImageStorageKey: text('cover_image_storage_key'),
    venue: varchar('venue', { length: 500 }),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }),
    timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),
    status: eventStatusEnum('status').notNull().default('DRAFT'),
    privacySettings: jsonb('privacy_settings')
      .$type<{
        requireAuthentication: boolean;
        requireConsent: boolean;
        allowPhotoDownload: boolean;
        allowPhotoSharing: boolean;
        guestGalleryExpiryDays: number | null;
      }>()
      .notNull()
      .default({
        requireAuthentication: true,
        requireConsent: true,
        allowPhotoDownload: true,
        allowPhotoSharing: false,
        guestGalleryExpiryDays: null,
      }),
    retentionSettings: jsonb('retention_settings')
      .$type<{
        faceDataRetentionDays: number;
        photoRetentionDays: number | null;
      }>()
      .notNull()
      .default({
        faceDataRetentionDays: 90,
        photoRetentionDays: null,
      }),
    brandingSettings: jsonb('branding_settings')
      .$type<{
        logoUrl?: string | null;
        accentColor?: string;
        welcomeMessage?: string;
        ctaText?: string;
        galleryAppearance?: 'grid' | 'masonry';
      }>()
      .default({}),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('events_org_slug_idx').on(t.organizationId, t.slug),
    index('events_org_idx').on(t.organizationId),
    index('events_status_idx').on(t.status),
  ],
);

// ─── Event Members (Photographers assigned to events) ─────────────────────

export const eventMemberRoleEnum = pgEnum('event_member_role', ['LEAD_PHOTOGRAPHER', 'PHOTOGRAPHER', 'VIEWER']);

export const eventMembers = pgTable(
  'event_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: eventMemberRoleEnum('role').notNull().default('PHOTOGRAPHER'),
    invitedAt: timestamp('invited_at', { withTimezone: true }).defaultNow().notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('event_members_event_user_idx').on(t.eventId, t.userId),
    index('event_members_event_idx').on(t.eventId),
    index('event_members_user_idx').on(t.userId),
  ],
);

// ─── Albums ────────────────────────────────────────────────────────────────

export const albumStatusEnum = pgEnum('album_status', ['ACTIVE', 'ARCHIVED']);

export const albums = pgTable(
  'albums',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    coverPhotoId: uuid('cover_photo_id'), // self-reference, set after photos exist
    sortOrder: integer('sort_order').notNull().default(0),
    status: albumStatusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('albums_event_idx').on(t.eventId)],
);

// ─── Photos ────────────────────────────────────────────────────────────────

export const photoProcessingStatusEnum = pgEnum('photo_processing_status', [
  'UPLOADING',
  'UPLOADED',
  'QUEUED',
  'PROCESSING',
  'FACE_DETECTION',
  'FACE_INDEXING',
  'READY',
  'FAILED',
  'DELETED',
]);

export const photos = pgTable(
  'photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'restrict' }),
    albumId: uuid('album_id').references(() => albums.id, { onDelete: 'set null' }),
    // Storage keys — NEVER exposed to clients directly
    storageKey: text('storage_key').notNull(),
    previewStorageKey: text('preview_storage_key'),
    thumbnailStorageKey: text('thumbnail_storage_key'),
    originalFilename: varchar('original_filename', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 50 }).notNull(),
    fileSize: integer('file_size').notNull(),
    width: integer('width'),
    height: integer('height'),
    checksum: varchar('checksum', { length: 64 }).notNull(), // SHA-256 hex
    captureTimestamp: timestamp('capture_timestamp', { withTimezone: true }),
    processingStatus: photoProcessingStatusEnum('processing_status')
      .notNull()
      .default('UPLOADING'),
    processingError: text('processing_error'),
    uploadedBy: uuid('uploaded_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('photos_event_idx').on(t.eventId),
    index('photos_album_idx').on(t.albumId),
    index('photos_status_idx').on(t.processingStatus),
    uniqueIndex('photos_event_checksum_idx').on(t.eventId, t.checksum),
    // Partial index for photos ready for search
    index('photos_event_ready_idx').on(t.eventId, t.processingStatus),
  ],
);

// ─── Photo Faces ────────────────────────────────────────────────────────────

export const photoFaces = pgTable(
  'photo_faces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    photoId: uuid('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    // Bounding box (normalized 0-1 coordinates)
    boundingBoxLeft: text('bounding_box_left').notNull(),
    boundingBoxTop: text('bounding_box_top').notNull(),
    boundingBoxWidth: text('bounding_box_width').notNull(),
    boundingBoxHeight: text('bounding_box_height').notNull(),
    qualityScore: text('quality_score'), // stored as text to avoid float precision issues
    detectionConfidence: text('detection_confidence'),
    // External face ID from recognition provider (e.g. Rekognition FaceId)
    externalFaceId: varchar('external_face_id', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('photo_faces_photo_idx').on(t.photoId),
    index('photo_faces_event_idx').on(t.eventId),
  ],
);

// ─── Face Matches (search results) ────────────────────────────────────────
// Records of successful face-to-face matches for audit + analytics

export const faceMatches = pgTable(
  'face_matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    searchId: uuid('search_id').notNull(), // groups all results of one search session
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    photoFaceId: uuid('photo_face_id')
      .notNull()
      .references(() => photoFaces.id, { onDelete: 'cascade' }),
    photoId: uuid('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'cascade' }),
    // Similarity score stored for analytics — NEVER logged or exposed raw
    similarityScore: text('similarity_score').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('face_matches_search_idx').on(t.searchId),
    index('face_matches_user_event_idx').on(t.userId, t.eventId),
    index('face_matches_event_idx').on(t.eventId),
  ],
);

// ─── QR Codes ──────────────────────────────────────────────────────────────

export const qrCodeStatusEnum = pgEnum('qr_code_status', ['ACTIVE', 'DISABLED', 'EXPIRED']);

export const qrCodes = pgTable(
  'qr_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 64 }).notNull(), // opaque random token
    label: varchar('label', { length: 100 }),
    status: qrCodeStatusEnum('status').notNull().default('ACTIVE'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    scanCount: integer('scan_count').notNull().default(0),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('qr_codes_token_idx').on(t.token),
    index('qr_codes_event_idx').on(t.eventId),
  ],
);

// ─── Guest Sessions ────────────────────────────────────────────────────────

export const guestSessions = pgTable(
  'guest_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    qrCodeId: uuid('qr_code_id').references(() => qrCodes.id),
    consentGrantedAt: timestamp('consent_granted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('guest_sessions_user_event_idx').on(t.userId, t.eventId),
    index('guest_sessions_event_idx').on(t.eventId),
  ],
);

// ─── Consents ──────────────────────────────────────────────────────────────

export const consentStatusEnum = pgEnum('consent_status', ['GRANTED', 'WITHDRAWN']);

export const consents = pgTable(
  'consents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    consentType: varchar('consent_type', { length: 50 }).notNull().default('FACE_RECOGNITION'),
    policyVersion: varchar('policy_version', { length: 20 }).notNull(),
    status: consentStatusEnum('status').notNull().default('GRANTED'),
    grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
    ipAddress: varchar('ip_address', { length: 45 }), // IPv6 max length
    userAgent: text('user_agent'),
  },
  (t) => [
    uniqueIndex('consents_user_event_type_idx').on(t.userId, t.eventId, t.consentType),
    index('consents_event_idx').on(t.eventId),
  ],
);

// ─── Processing Jobs ───────────────────────────────────────────────────────

export const processingJobStatusEnum = pgEnum('processing_job_status', [
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'RETRYING',
  'CANCELLED',
]);

export const processingJobTypeEnum = pgEnum('processing_job_type', [
  'IMAGE_PROCESSING',
  'FACE_DETECTION',
  'FACE_EMBEDDING',
  'DOWNLOAD_ZIP',
]);

export const processingJobs = pgTable(
  'processing_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    photoId: uuid('photo_id').references(() => photos.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id),
    jobType: processingJobTypeEnum('job_type').notNull(),
    bullJobId: varchar('bull_job_id', { length: 255 }), // BullMQ job ID
    status: processingJobStatusEnum('status').notNull().default('QUEUED'),
    attempt: integer('attempt').notNull().default(1),
    maxAttempts: integer('max_attempts').notNull().default(3),
    errorCode: varchar('error_code', { length: 100 }),
    errorMessage: text('error_message'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('processing_jobs_event_idx').on(t.eventId),
    index('processing_jobs_photo_idx').on(t.photoId),
    index('processing_jobs_status_idx').on(t.status),
  ],
);

// ─── Download Jobs ─────────────────────────────────────────────────────────

export const downloadJobStatusEnum = pgEnum('download_job_status', [
  'QUEUED',
  'PROCESSING',
  'READY',
  'EXPIRED',
  'FAILED',
]);

export const downloadJobs = pgTable(
  'download_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id),
    photoIds: jsonb('photo_ids').$type<string[]>().notNull(),
    photoCount: integer('photo_count').notNull(),
    status: downloadJobStatusEnum('status').notNull().default('QUEUED'),
    zipStorageKey: text('zip_storage_key'),
    downloadUrl: text('download_url'), // signed URL (ephemeral)
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    index('download_jobs_user_idx').on(t.userId),
    index('download_jobs_event_idx').on(t.eventId),
    index('download_jobs_status_idx').on(t.status),
  ],
);

// ─── Privacy Requests ──────────────────────────────────────────────────────

export const privacyRequestTypeEnum = pgEnum('privacy_request_type', [
  'ACCESS',
  'DELETION',
  'CORRECTION',
  'CONSENT_WITHDRAWAL',
]);

export const privacyRequestStatusEnum = pgEnum('privacy_request_status', [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
]);

export const privacyRequests = pgTable(
  'privacy_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id').references(() => events.id),
    requestType: privacyRequestTypeEnum('request_type').notNull(),
    status: privacyRequestStatusEnum('status').notNull().default('PENDING'),
    notes: text('notes'),
    adminNotes: text('admin_notes'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    index('privacy_requests_user_idx').on(t.userId),
    index('privacy_requests_status_idx').on(t.status),
  ],
);

// ─── Notifications ─────────────────────────────────────────────────────────

export const notificationChannelEnum = pgEnum('notification_channel', ['EMAIL', 'SMS', 'PUSH']);
export const notificationStatusEnum = pgEnum('notification_status', ['PENDING', 'SENT', 'FAILED']);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    channel: notificationChannelEnum('channel').notNull(),
    template: varchar('template', { length: 100 }).notNull(),
    status: notificationStatusEnum('status').notNull().default('PENDING'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('notifications_user_idx').on(t.userId)],
);

// ─── Subscriptions ─────────────────────────────────────────────────────────

export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'FREE',
  'PRO',
  'BUSINESS',
  'ENTERPRISE',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'ACTIVE',
  'CANCELLED',
  'PAST_DUE',
  'TRIALING',
  'EXPIRED',
]);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    plan: subscriptionPlanEnum('plan').notNull().default('FREE'),
    status: subscriptionStatusEnum('status').notNull().default('ACTIVE'),
    // External payment provider references
    externalSubscriptionId: varchar('external_subscription_id', { length: 255 }),
    externalCustomerId: varchar('external_customer_id', { length: 255 }),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('subscriptions_org_idx').on(t.organizationId),
    index('subscriptions_status_idx').on(t.status),
  ],
);

// ─── Subscription Usage ────────────────────────────────────────────────────

export const subscriptionUsage = pgTable(
  'subscription_usage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    photosUploaded: integer('photos_uploaded').notNull().default(0),
    photosProcessed: integer('photos_processed').notNull().default(0),
    facesIndexed: integer('faces_indexed').notNull().default(0),
    faceSearches: integer('face_searches').notNull().default(0),
    storageBytes: text('storage_bytes').notNull().default('0'), // bigint as text
    downloads: integer('downloads').notNull().default(0),
    eventsCreated: integer('events_created').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('subscription_usage_org_period_idx').on(t.organizationId, t.periodStart)],
);

// ─── Audit Logs ────────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    action: varchar('action', { length: 100 }).notNull(),
    actorId: uuid('actor_id').references(() => users.id),
    actorEmail: varchar('actor_email', { length: 255 }), // denormalized for log retention
    organizationId: uuid('organization_id').references(() => organizations.id),
    eventId: uuid('event_id').references(() => events.id),
    resourceType: varchar('resource_type', { length: 50 }),
    resourceId: uuid('resource_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('audit_logs_actor_idx').on(t.actorId),
    index('audit_logs_org_idx').on(t.organizationId),
    index('audit_logs_event_idx').on(t.eventId),
    index('audit_logs_action_idx').on(t.action),
    index('audit_logs_created_idx').on(t.createdAt),
  ],
);

// ─── Event Analytics ───────────────────────────────────────────────────────

export const eventAnalytics = pgTable(
  'event_analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    date: timestamp('date', { withTimezone: true }).notNull(), // truncated to day
    qrScans: integer('qr_scans').notNull().default(0),
    uniqueVisitors: integer('unique_visitors').notNull().default(0),
    registrations: integer('registrations').notNull().default(0),
    faceSearches: integer('face_searches').notNull().default(0),
    successfulSearches: integer('successful_searches').notNull().default(0),
    failedSearches: integer('failed_searches').notNull().default(0),
    photosViewed: integer('photos_viewed').notNull().default(0),
    photosDownloaded: integer('photos_downloaded').notNull().default(0),
    bulkDownloads: integer('bulk_downloads').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('event_analytics_event_date_idx').on(t.eventId, t.date),
    index('event_analytics_event_idx').on(t.eventId),
  ],
);

// ─── System Settings ───────────────────────────────────────────────────────

export const systemSettings = pgTable('system_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
});
