import { Module } from '@nestjs/common';
import { DownloadsService } from './downloads.service.js';
import { DownloadsController } from './downloads.controller.js';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env['JWT_SECRET'] ?? 'dev-secret-key-change-in-production-12345',
    }),
  ],
  controllers: [DownloadsController],
  providers: [DownloadsService],
  exports: [DownloadsService],
})
export class DownloadsModule {}
