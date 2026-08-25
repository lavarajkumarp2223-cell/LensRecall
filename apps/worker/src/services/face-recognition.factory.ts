import { FaceRecognitionService } from '../../../apps/api/src/providers/face-recognition/face-recognition.service.js';

let instance: FaceRecognitionService | null = null;

export function getFaceRecognitionService(): FaceRecognitionService {
  if (instance) return instance;

  const provider = process.env['FACE_RECOGNITION_PROVIDER'] ?? 'mock';

  switch (provider) {
    case 'rekognition': {
      const { RekognitionAdapter } = require('../../../apps/api/src/providers/face-recognition/rekognition.adapter.js');
      instance = new RekognitionAdapter();
      break;
    }
    case 'mock': {
      const { MockFaceRecognitionAdapter } = require('../../../apps/api/src/providers/face-recognition/mock.adapter.js');
      instance = new MockFaceRecognitionAdapter();
      break;
    }
    default:
      throw new Error(`Unknown FACE_RECOGNITION_PROVIDER: "${provider}"`);
  }

  return instance!;
}
