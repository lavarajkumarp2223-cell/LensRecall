import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { StorageService, UploadOptions, SignedUploadUrl, StorageObject } from './storage.service.js';

/**
 * R2StorageAdapter — Cloudflare R2 implementation.
 *
 * Cloudflare R2 is S3-compatible, so we use the AWS SDK with a custom endpoint.
 * R2 has no egress fees for data served to the internet.
 *
 * Env vars required:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 */
@Injectable()
export class R2StorageAdapter extends StorageService {
  private readonly logger = new Logger(R2StorageAdapter.name);
  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor() {
    super();

    const accountId = process.env['R2_ACCOUNT_ID'];
    const accessKeyId = process.env['R2_ACCESS_KEY_ID'];
    const secretAccessKey = process.env['R2_SECRET_ACCESS_KEY'];
    const bucketName = process.env['R2_BUCKET_NAME'];

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error(
        'Missing required Cloudflare R2 environment variables: ' +
          'R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME',
      );
    }

    this.bucketName = bucketName;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async generateUploadUrl(key: string, options: UploadOptions): Promise<SignedUploadUrl> {
    const expiresInSeconds = options.expiresInSeconds ?? 3600; // 1 hour default

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: options.contentType,
      ContentLength: options.maxSizeBytes,
      Metadata: options.metadata,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      uploadUrl,
      key,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  async generateDownloadUrl(key: string, ttlSeconds: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn: ttlSeconds });
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
    this.logger.debug(`Deleted object: ${key}`);
  }

  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    // S3/R2 allows up to 1000 objects per batch delete
    const chunks = this.chunk(keys, 1000);
    for (const chunk of chunks) {
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: {
            Objects: chunk.map((k) => ({ Key: k })),
            Quiet: true,
          },
        }),
      );
    }
    this.logger.debug(`Deleted ${keys.length} objects`);
  }

  async copyObject(sourceKey: string, destKey: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destKey,
      }),
    );
  }

  async objectExists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async getObjectMetadata(key: string): Promise<StorageObject | null> {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      return {
        key,
        sizeBytes: response.ContentLength ?? 0,
        contentType: response.ContentType ?? 'application/octet-stream',
        lastModified: response.LastModified ?? new Date(),
        metadata: response.Metadata,
      };
    } catch {
      return null;
    }
  }

  async uploadBuffer(
    key: string,
    buffer: Buffer,
    options: { contentType: string; metadata?: Record<string, string> },
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: options.contentType,
        ContentLength: buffer.length,
        Metadata: options.metadata,
      }),
    );
    this.logger.debug(`Uploaded buffer to: ${key} (${buffer.length} bytes)`);
  }

  async downloadBuffer(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );

    if (!response.Body) {
      throw new Error(`No body in response for key: ${key}`);
    }

    const chunks: Uint8Array[] = [];
    // @ts-expect-error: Body is a ReadableStream in Node.js
    for await (const chunk of response.Body) {
      chunks.push(chunk as Uint8Array);
    }
    return Buffer.concat(chunks);
  }

  private chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
