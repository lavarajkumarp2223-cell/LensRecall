import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  // ─── Global Prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── CORS ─────────────────────────────────────────────────────────────────
  const allowedOrigins = (process.env['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
  });

  // ─── Global Validation Pipe ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,          // Auto-transform to DTO types
      transformOptions: {
        enableImplicitConversion: false, // Explicit only
      },
    }),
  );

  // ─── Security Headers ─────────────────────────────────────────────────────
  // Fastify has helmet as a plugin, but we apply basic headers manually here
  app.use((_req: unknown, res: { setHeader: (k: string, v: string) => void; next: () => void }, next: () => void) => {
    if (typeof res === 'object' && res !== null) {
      (res as Record<string, (k: string, v: string) => void>)['setHeader']('X-Content-Type-Options', 'nosniff');
      (res as Record<string, (k: string, v: string) => void>)['setHeader']('X-Frame-Options', 'DENY');
      (res as Record<string, (k: string, v: string) => void>)['setHeader']('X-XSS-Protection', '1; mode=block');
      (res as Record<string, (k: string, v: string) => void>)['setHeader'](
        'Referrer-Policy',
        'strict-origin-when-cross-origin',
      );
    }
    if (typeof next === 'function') next();
  });

  // ─── API Documentation (dev/staging only) ─────────────────────────────────
  if (process.env['NODE_ENV'] !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('LensRecall API')
      .setDescription('LensRecall — AI-Powered Event Photo Discovery Platform')
      .setVersion('0.1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication')
      .addTag('organizations', 'Organization management')
      .addTag('events', 'Event management')
      .addTag('photos', 'Photo management')
      .addTag('uploads', 'File uploads')
      .addTag('face-search', 'Guest face search')
      .addTag('gallery', 'Guest gallery')
      .addTag('downloads', 'Photo downloads')
      .addTag('qr', 'QR code management')
      .addTag('privacy', 'Privacy and data requests')
      .addTag('admin', 'Super admin')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger docs available at: /api/docs');
  }

  // ─── Start ────────────────────────────────────────────────────────────────
  const port = parseInt(process.env['API_PORT'] ?? '3001', 10);
  const host = process.env['NODE_ENV'] === 'production' ? '0.0.0.0' : '127.0.0.1';

  await app.listen(port, host);
  logger.log(`LensRecall API running on port ${port} [${process.env['NODE_ENV'] ?? 'development'}]`);
}

bootstrap().catch((err) => {
  console.error('Failed to start LensRecall API:', err);
  process.exit(1);
});
