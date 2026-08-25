import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_NAMES } from '@lensrecall/shared';
import { imageProcessingProcessor } from './processors/image.processor.js';
import { faceDetectionProcessor } from './processors/face-detection.processor.js';
import { faceEmbeddingProcessor } from './processors/face-embedding.processor.js';
import { downloadZipProcessor } from './processors/download-zip.processor.js';

const connection = new IORedis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Required by BullMQ
});

const concurrency = {
  image: parseInt(process.env['QUEUE_CONCURRENCY_IMAGE'] ?? '5', 10),
  faceDetection: parseInt(process.env['QUEUE_CONCURRENCY_FACE_DETECTION'] ?? '3', 10),
  faceEmbedding: parseInt(process.env['QUEUE_CONCURRENCY_FACE_EMBEDDING'] ?? '3', 10),
  downloadZip: parseInt(process.env['QUEUE_CONCURRENCY_DOWNLOAD_ZIP'] ?? '2', 10),
};

async function main() {
  console.log('[Worker] Starting LensRecall background workers...');

  const workers = [
    new Worker(QUEUE_NAMES.IMAGE_PROCESSING, imageProcessingProcessor, {
      connection,
      concurrency: concurrency.image,
    }),
    new Worker(QUEUE_NAMES.FACE_DETECTION, faceDetectionProcessor, {
      connection,
      concurrency: concurrency.faceDetection,
    }),
    new Worker(QUEUE_NAMES.FACE_EMBEDDING, faceEmbeddingProcessor, {
      connection,
      concurrency: concurrency.faceEmbedding,
    }),
    new Worker(QUEUE_NAMES.DOWNLOAD_ZIP, downloadZipProcessor, {
      connection,
      concurrency: concurrency.downloadZip,
    }),
  ];

  for (const worker of workers) {
    worker.on('completed', (job) => {
      console.log(`[Worker] ✓ ${job.queueName}/${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[Worker] ✗ ${job?.queueName}/${job?.id} failed:`, err.message);
    });

    worker.on('error', (err) => {
      console.error(`[Worker] Error:`, err);
    });
  }

  console.log(`[Worker] Running ${workers.length} worker types`);
  console.log(`[Worker] Concurrency: image=${concurrency.image}, face=${concurrency.faceDetection}, embed=${concurrency.faceEmbedding}, zip=${concurrency.downloadZip}`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[Worker] Shutting down gracefully...');
    await Promise.all(workers.map((w) => w.close()));
    await connection.quit();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}

void main();
