import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private client: S3Client | null = null;
  private signedUrlClient: S3Client | null = null;

  constructor(private readonly configService: ConfigService) {}

  async uploadObject(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    await this.getClient().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    await this.getClient().send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  }

  async getSignedUrl(bucket: string, key: string): Promise<string> {
    return getSignedUrl(
      this.getSignedUrlClient(),
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
      { expiresIn: 3600 },
    );
  }

  async getObjectText(bucket: string, key: string): Promise<string> {
    const response = await this.getClient().send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    const body = response.Body as
      | {
          transformToString: (encoding?: string) => Promise<string>;
        }
      | undefined;

    if (!body) {
      throw new Error(`Object ${bucket}/${key} has no body.`);
    }

    return body.transformToString('utf-8');
  }

  private getClient(): S3Client {
    if (this.client) {
      return this.client;
    }

    this.client = new S3Client({
      endpoint: this.readRequiredEnv('S3_ENDPOINT'),
      region: this.readRequiredEnv('S3_REGION'),
      forcePathStyle: this.readBooleanEnv('S3_FORCE_PATH_STYLE'),
      credentials: {
        accessKeyId: this.readRequiredEnv('S3_ACCESS_KEY'),
        secretAccessKey: this.readRequiredEnv('S3_SECRET_KEY'),
      },
    });

    return this.client;
  }

  private getSignedUrlClient(): S3Client {
    if (this.signedUrlClient) {
      return this.signedUrlClient;
    }

    this.signedUrlClient = new S3Client({
      endpoint:
        this.readOptionalEnv('S3_PUBLIC_ENDPOINT') ??
        this.readRequiredEnv('S3_ENDPOINT'),
      region: this.readRequiredEnv('S3_REGION'),
      forcePathStyle: this.readBooleanEnv('S3_FORCE_PATH_STYLE'),
      credentials: {
        accessKeyId: this.readRequiredEnv('S3_ACCESS_KEY'),
        secretAccessKey: this.readRequiredEnv('S3_SECRET_KEY'),
      },
    });

    return this.signedUrlClient;
  }

  getAssetsBucket(): string {
    return this.readRequiredEnv('S3_ASSETS_BUCKET');
  }

  getFontsBucket(): string {
    return this.readRequiredEnv('S3_FONTS_BUCKET');
  }

  getExportsBucket(): string {
    return this.readRequiredEnv('S3_EXPORTS_BUCKET');
  }

  private readRequiredEnv(key: string): string {
    const value = this.readOptionalEnv(key);

    if (!value) {
      throw new Error(`${key} is not configured.`);
    }

    return value;
  }

  private readOptionalEnv(key: string): string | undefined {
    return this.configService.get<string>(key)?.trim() || undefined;
  }

  private readBooleanEnv(key: string): boolean {
    return this.readRequiredEnv(key).toLowerCase() === 'true';
  }
}
