import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

// Core modules
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { OrganizationsModule } from './modules/organizations/organizations.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { AlbumsModule } from './modules/albums/albums.module.js';
import { PhotosModule } from './modules/photos/photos.module.js';
import { UploadsModule } from './modules/uploads/uploads.module.js';
import { ProcessingModule } from './modules/processing/processing.module.js';
import { FaceDetectionModule } from './modules/face-detection/face-detection.module.js';
import { QrCodesModule } from './modules/qr-codes/qr-codes.module.js';
import { GuestsModule } from './modules/guests/guests.module.js';
import { GalleryModule } from './modules/gallery/gallery.module.js';
import { DownloadsModule } from './modules/downloads/downloads.module.js';
import { ConsentModule } from './modules/consent/consent.module.js';
import { PrivacyModule } from './modules/privacy/privacy.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { BillingModule } from './modules/billing/billing.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { HealthModule } from './modules/health/health.module.js';

// Provider modules
import { StorageProviderModule } from './providers/storage/storage.module.js';
import { FaceRecognitionProviderModule } from './providers/face-recognition/face-recognition.module.js';
import { NotificationProviderModule } from './providers/notifications/notification.module.js';

// Database
import { DatabaseModule } from './database/database.module.js';

@Module({
  imports: [
    // ─── Rate Limiting ─────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,     // 1 second
        limit: 20,     // 20 requests per second globally
      },
      {
        name: 'medium',
        ttl: 60_000,   // 1 minute
        limit: 500,    // 500 requests per minute globally
      },
    ]),

    // ─── Infrastructure ────────────────────────────────────────────────────
    DatabaseModule,
    StorageProviderModule,
    FaceRecognitionProviderModule,
    NotificationProviderModule,

    // ─── Feature Modules ───────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    OrganizationsModule,
    EventsModule,
    AlbumsModule,
    PhotosModule,
    UploadsModule,
    ProcessingModule,
    FaceDetectionModule,
    QrCodesModule,
    GuestsModule,
    GalleryModule,
    DownloadsModule,
    ConsentModule,
    PrivacyModule,
    NotificationsModule,
    AuditModule,
    AnalyticsModule,
    BillingModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
