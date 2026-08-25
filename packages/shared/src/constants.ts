/**
 * LensRecall Shared Constants
 */

// Queue names
export const QUEUE_NAMES = {
  IMAGE_PROCESSING: 'image-processing',
  FACE_DETECTION: 'face-detection',
  FACE_EMBEDDING: 'face-embedding',
  DOWNLOAD_ZIP: 'download-zip',
  NOTIFICATIONS: 'notifications',
} as const;

// Storage key prefixes (convention: events/{eventId}/photos/{size}/{photoId}.{ext})
export const STORAGE_KEYS = {
  photoOriginal: (eventId: string, photoId: string) =>
    `events/${eventId}/photos/original/${photoId}`,
  photoPreview: (eventId: string, photoId: string) =>
    `events/${eventId}/photos/preview/${photoId}.webp`,
  photoThumbnail: (eventId: string, photoId: string) =>
    `events/${eventId}/photos/thumb/${photoId}.webp`,
  downloadZip: (downloadJobId: string) => `downloads/zips/${downloadJobId}.zip`,
  eventCover: (organizationId: string, eventId: string) =>
    `orgs/${organizationId}/events/${eventId}/cover`,
  orgLogo: (organizationId: string) => `orgs/${organizationId}/logo`,
} as const;

// Face recognition constants
export const FACE_RECOGNITION = {
  DEFAULT_SIMILARITY_THRESHOLD: 80,
  MAX_FACES_PER_IMAGE: 50,
  MIN_FACE_QUALITY_SCORE: 0.5,
  EMBEDDING_DIMENSIONS: 128, // Rekognition uses 128-dim
} as const;

// Image processing
export const IMAGE_PROCESSING = {
  THUMBNAIL_WIDTH: 300,
  THUMBNAIL_HEIGHT: 300,
  PREVIEW_MAX_WIDTH: 1920,
  PREVIEW_QUALITY: 85,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ] as const,
  MAX_FILE_SIZE_BYTES: 52_428_800, // 50 MB
} as const;

export const IMAGE_LIMITS = IMAGE_PROCESSING;

// API paths (keep in sync with NestJS routes)
export const API_PATHS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  ORGANIZATIONS: '/api/organizations',
  EVENTS: '/api/events',
  PHOTOS: '/api/photos',
  UPLOADS: '/api/uploads',
  PROCESSING: '/api/processing',
  FACE_SEARCH: (eventToken: string) => `/api/events/${eventToken}/face-search`,
  GUESTS: '/api/guests',
  GALLERY: '/api/gallery',
  DOWNLOADS: '/api/downloads',
  QR: '/api/qr',
  PRIVACY: '/api/privacy',
  NOTIFICATIONS: '/api/notifications',
  BILLING: '/api/billing',
  ADMIN: '/api/admin',
} as const;

// Privacy policy version (bump when policy changes)
export const CURRENT_POLICY_VERSION = '1.0.0';

// Default retention settings
export const DEFAULT_RETENTION = {
  FACE_DATA_DAYS: 90,
  DOWNLOAD_ZIP_HOURS: 24,
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PHOTO_PAGE_SIZE: 30,
} as const;

// QR token length (bytes -> hex = double length)
export const QR_TOKEN_BYTES = 32;

// Supported timezones metadata URL
export const IANA_TIMEZONE_REFERENCE = 'https://en.wikipedia.org/wiki/List_of_tz_database_time_zones';
