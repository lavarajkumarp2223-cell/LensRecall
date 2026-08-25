/**
 * LensRecall Shared Types
 *
 * This file is the central source of truth for all domain types used
 * across web, api, and worker applications. Never duplicate these types.
 */

// ─── Enums ─────────────────────────────────────────────────────────────────

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORGANIZER = 'ORGANIZER',
  PHOTOGRAPHER = 'PHOTOGRAPHER',
  GUEST = 'GUEST',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  DELETED = 'DELETED',
}

export enum AuthProvider {
  GOOGLE = 'GOOGLE',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
}

export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum OrganizationMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum EventType {
  WEDDING = 'WEDDING',
  ENGAGEMENT = 'ENGAGEMENT',
  RECEPTION = 'RECEPTION',
  BIRTHDAY = 'BIRTHDAY',
  ANNIVERSARY = 'ANNIVERSARY',
  CORPORATE = 'CORPORATE',
  CONFERENCE = 'CONFERENCE',
  COLLEGE = 'COLLEGE',
  FESTIVAL = 'FESTIVAL',
  CONCERT = 'CONCERT',
  SPORTS = 'SPORTS',
  PRIVATE = 'PRIVATE',
  OTHER = 'OTHER',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export enum PhotoProcessingStatus {
  UPLOADING = 'UPLOADING',
  UPLOADED = 'UPLOADED',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  FACE_DETECTION = 'FACE_DETECTION',
  FACE_INDEXING = 'FACE_INDEXING',
  READY = 'READY',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

export enum ProcessingJobStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  CANCELLED = 'CANCELLED',
}

export enum QrCodeStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  EXPIRED = 'EXPIRED',
}

export enum ConsentStatus {
  GRANTED = 'GRANTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum PrivacyRequestType {
  ACCESS = 'ACCESS',
  DELETION = 'DELETION',
  CORRECTION = 'CORRECTION',
  CONSENT_WITHDRAWAL = 'CONSENT_WITHDRAWAL',
}

export enum PrivacyRequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export enum DownloadJobStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
  TRIALING = 'TRIALING',
  EXPIRED = 'EXPIRED',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum AuditAction {
  // Auth
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_RESET = 'PASSWORD_RESET',
  // Organizations
  ORG_CREATED = 'ORG_CREATED',
  ORG_UPDATED = 'ORG_UPDATED',
  ORG_DELETED = 'ORG_DELETED',
  ORG_MEMBER_ADDED = 'ORG_MEMBER_ADDED',
  ORG_MEMBER_REMOVED = 'ORG_MEMBER_REMOVED',
  // Events
  EVENT_CREATED = 'EVENT_CREATED',
  EVENT_UPDATED = 'EVENT_UPDATED',
  EVENT_DELETED = 'EVENT_DELETED',
  EVENT_PUBLISHED = 'EVENT_PUBLISHED',
  // Photos
  PHOTO_UPLOADED = 'PHOTO_UPLOADED',
  PHOTO_DELETED = 'PHOTO_DELETED',
  PHOTO_BULK_DELETED = 'PHOTO_BULK_DELETED',
  // Guests
  GUEST_REGISTERED = 'GUEST_REGISTERED',
  CONSENT_GRANTED = 'CONSENT_GRANTED',
  CONSENT_WITHDRAWN = 'CONSENT_WITHDRAWN',
  FACE_SEARCH_PERFORMED = 'FACE_SEARCH_PERFORMED',
  // Downloads
  DOWNLOAD_REQUESTED = 'DOWNLOAD_REQUESTED',
  DOWNLOAD_COMPLETED = 'DOWNLOAD_COMPLETED',
  // Privacy
  PRIVACY_REQUEST_SUBMITTED = 'PRIVACY_REQUEST_SUBMITTED',
  PRIVACY_REQUEST_COMPLETED = 'PRIVACY_REQUEST_COMPLETED',
  FACE_DATA_DELETED = 'FACE_DATA_DELETED',
  // Admin
  ADMIN_ACTION = 'ADMIN_ACTION',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
  // Billing
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  // QR
  QR_GENERATED = 'QR_GENERATED',
  QR_DISABLED = 'QR_DISABLED',
  QR_SCANNED = 'QR_SCANNED',
}

// ─── Domain Types ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  authProvider: AuthProvider;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandingSettings: OrganizationBrandingSettings;
  status: OrganizationStatus;
  planId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationBrandingSettings {
  primaryColor?: string;
  accentColor?: string;
  customDomain?: string | null;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationMemberRole;
  invitedAt: string;
  joinedAt: string | null;
}

export interface Event {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  eventType: EventType;
  description: string | null;
  coverImageUrl: string | null;
  venue: string | null;
  startDate: string;
  endDate: string | null;
  timezone: string;
  status: EventStatus;
  privacySettings: EventPrivacySettings;
  retentionSettings: EventRetentionSettings;
  brandingSettings: EventBrandingSettings;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventPrivacySettings {
  requireAuthentication: boolean;
  requireConsent: boolean;
  allowPhotoDownload: boolean;
  allowPhotoSharing: boolean;
  guestGalleryExpiryDays: number | null;
}

export interface EventRetentionSettings {
  faceDataRetentionDays: number;
  photoRetentionDays: number | null; // null = indefinite unless deleted
}

export interface EventBrandingSettings {
  logoUrl?: string | null;
  accentColor?: string;
  welcomeMessage?: string;
  ctaText?: string;
  galleryAppearance?: 'grid' | 'masonry';
}

export interface Album {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  coverPhotoId: string | null;
  sortOrder: number;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  eventId: string;
  albumId: string | null;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  checksum: string;
  captureTimestamp: string | null;
  processingStatus: PhotoProcessingStatus;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  // Storage keys are NEVER returned to clients — only signed URLs
  thumbnailUrl?: string; // ephemeral signed URL
  previewUrl?: string; // ephemeral signed URL
}

export interface PhotoFace {
  id: string;
  photoId: string;
  eventId: string;
  boundingBox: FaceBoundingBox;
  qualityScore: number | null;
  detectionConfidence: number | null;
  createdAt: string;
}

export interface FaceBoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface QrCode {
  id: string;
  eventId: string;
  token: string; // opaque random token
  label: string | null;
  status: QrCodeStatus;
  expiresAt: string | null;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GuestSession {
  id: string;
  userId: string;
  eventId: string;
  consentGrantedAt: string | null;
  createdAt: string;
  lastActiveAt: string;
}

export interface Consent {
  id: string;
  userId: string;
  eventId: string;
  consentType: 'FACE_RECOGNITION';
  policyVersion: string;
  status: ConsentStatus;
  grantedAt: string;
  withdrawnAt: string | null;
}

export interface PrivacyRequest {
  id: string;
  userId: string;
  eventId: string | null;
  requestType: PrivacyRequestType;
  status: PrivacyRequestStatus;
  notes: string | null;
  requestedAt: string;
  completedAt: string | null;
}

export interface ProcessingJob {
  id: string;
  photoId: string;
  eventId: string;
  jobType: 'IMAGE_PROCESSING' | 'FACE_DETECTION' | 'FACE_EMBEDDING' | 'DOWNLOAD_ZIP';
  status: ProcessingJobStatus;
  attempt: number;
  maxAttempts: number;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface DownloadJob {
  id: string;
  userId: string;
  eventId: string;
  photoIds: string[];
  photoCount: number;
  status: DownloadJobStatus;
  downloadUrl: string | null; // signed URL when ready
  expiresAt: string | null;
  createdAt: string;
  completedAt: string | null;
}

// ─── API Response Types ────────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

// ─── Face Search Types (safe for API responses) ───────────────────────────
// Note: raw embeddings (Float32Array) are NEVER returned to clients

export interface FaceSearchResult {
  photoId: string;
  thumbnailUrl: string;
  previewUrl: string;
  albumName: string | null;
  similarityScore: number; // normalized 0-1, for internal sorting only
  captureTimestamp: string | null;
}

export interface GalleryResult {
  totalFound: number;
  searchId: string; // for audit log reference
  photos: FaceSearchResult[];
}

// ─── Queue Job Payloads ────────────────────────────────────────────────────

export interface ImageProcessingJobData {
  photoId: string;
  eventId: string;
  organizationId: string;
  storageKey: string;
}

export interface FaceDetectionJobData {
  photoId: string;
  eventId: string;
  organizationId: string;
  storageKey: string;
}

export interface FaceEmbeddingJobData {
  photoFaceId: string;
  photoId: string;
  eventId: string;
  storageKey: string;
  boundingBox: FaceBoundingBox;
}

export interface DownloadZipJobData {
  downloadJobId: string;
  userId: string;
  eventId: string;
  photoIds: string[];
}

// ─── Notification Payloads ────────────────────────────────────────────────

export type EmailTemplate =
  | 'welcome'
  | 'magic-link'
  | 'upload-complete'
  | 'processing-complete'
  | 'processing-failed'
  | 'download-ready'
  | 'privacy-request-received'
  | 'privacy-request-completed'
  | 'photographer-invitation';

export interface EmailPayload {
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
}

// ─── Error Codes ──────────────────────────────────────────────────────────

export const ErrorCodes = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  EVENT_NOT_FOUND: 'EVENT_NOT_FOUND',
  PHOTO_NOT_FOUND: 'PHOTO_NOT_FOUND',
  ORGANIZATION_NOT_FOUND: 'ORGANIZATION_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  QR_NOT_FOUND: 'QR_NOT_FOUND',
  QR_DISABLED: 'QR_DISABLED',
  QR_EXPIRED: 'QR_EXPIRED',
  // Upload
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  DUPLICATE_FILE: 'DUPLICATE_FILE',
  // Face recognition
  NO_FACE_DETECTED: 'NO_FACE_DETECTED',
  MULTIPLE_FACES_DETECTED: 'MULTIPLE_FACES_DETECTED',
  FACE_QUALITY_TOO_LOW: 'FACE_QUALITY_TOO_LOW',
  FACE_SERVICE_UNAVAILABLE: 'FACE_SERVICE_UNAVAILABLE',
  FACE_SEARCH_FAILED: 'FACE_SEARCH_FAILED',
  // Consent
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
  CONSENT_ALREADY_WITHDRAWN: 'CONSENT_ALREADY_WITHDRAWN',
  // Event
  EVENT_NOT_ACTIVE: 'EVENT_NOT_ACTIVE',
  EVENT_ACCESS_DENIED: 'EVENT_ACCESS_DENIED',
  GALLERY_EXPIRED: 'GALLERY_EXPIRED',
  // Download
  DOWNLOAD_NOT_READY: 'DOWNLOAD_NOT_READY',
  DOWNLOAD_EXPIRED: 'DOWNLOAD_EXPIRED',
  DOWNLOAD_NOT_FOUND: 'DOWNLOAD_NOT_FOUND',
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
