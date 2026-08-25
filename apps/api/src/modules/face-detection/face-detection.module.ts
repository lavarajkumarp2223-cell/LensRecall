import { Module } from '@nestjs/common';
import { FaceDetectionService } from './face-detection.service.js';
import { FaceDetectionController } from './face-detection.controller.js';

@Module({
  controllers: [FaceDetectionController],
  providers: [FaceDetectionService],
  exports: [FaceDetectionService],
})
export class FaceDetectionModule {}
