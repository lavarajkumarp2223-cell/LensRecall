import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service.js';
import { UploadsController } from './uploads.controller.js';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env['JWT_SECRET'] ?? 'dev-secret-key-change-in-production-12345',
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
