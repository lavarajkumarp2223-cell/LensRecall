import { Module, Global } from '@nestjs/common';
import { FaceRecognitionService } from './face-recognition.service.js';
import { RekognitionAdapter } from './rekognition.adapter.js';
import { MockFaceRecognitionAdapter } from './mock.adapter.js';

/**
 * FaceRecognitionProviderModule — Selects the face recognition adapter.
 *
 * FACE_RECOGNITION_PROVIDER=rekognition  → RekognitionAdapter
 * FACE_RECOGNITION_PROVIDER=mock         → MockFaceRecognitionAdapter (dev only)
 *
 * Adding a new provider: create a new adapter implementing FaceRecognitionService,
 * add a case here. No other code needs to change.
 */
@Global()
@Module({
  providers: [
    {
      provide: FaceRecognitionService,
      useFactory: (): FaceRecognitionService => {
        const provider = process.env['FACE_RECOGNITION_PROVIDER'] ?? 'mock';

        switch (provider) {
          case 'rekognition':
            return new RekognitionAdapter();
          case 'mock':
            return new MockFaceRecognitionAdapter();
          default:
            throw new Error(
              `Unknown FACE_RECOGNITION_PROVIDER: "${provider}". ` +
                'Valid options: rekognition, mock',
            );
        }
      },
    },
  ],
  exports: [FaceRecognitionService],
})
export class FaceRecognitionProviderModule {}
