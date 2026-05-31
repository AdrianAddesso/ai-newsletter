import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { StorageService } from './storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('StorageService', () => {
  let service: StorageService;
  let sendMock: jest.SpyInstance;

  beforeEach(() => {
    const configService = {
      get: (key: string) =>
        ({
          S3_ENDPOINT: 'http://localhost:9000',
          S3_REGION: 'us-east-1',
          S3_ASSETS_BUCKET: 'ai-newsletter-assets',
          S3_FONTS_BUCKET: 'ai-newsletter-fonts',
          S3_EXPORTS_BUCKET: 'ai-newsletter-exports',
          S3_ACCESS_KEY: 'minioadmin',
          S3_SECRET_KEY: 'minioadmin123',
          S3_FORCE_PATH_STYLE: 'true',
        })[key],
    } as ConfigService;

    service = new StorageService(configService);
    sendMock = jest
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue({} as never);
    (getSignedUrl as jest.Mock).mockResolvedValue(
      'http://localhost:9000/ai-newsletter-assets/ai-assets/test.png?signature=fake',
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uploads objects to the configured bucket', async () => {
    await service.uploadObject(
      'ai-newsletter-assets',
      'ai-assets/test.png',
      Buffer.from('fake-image'),
      'image/png',
    );

    expect(sendMock).toHaveBeenCalledWith(expect.any(PutObjectCommand));
  });

  it('deletes objects from the configured bucket', async () => {
    await service.deleteObject(
      'ai-newsletter-assets',
      'ai-assets/test.png',
    );

    expect(sendMock).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
  });

  it('returns a signed url for the requested key', async () => {
    await expect(
      service.getSignedUrl(
        'ai-newsletter-assets',
        'ai-assets/test.png',
      ),
    ).resolves.toContain('signature=fake');
  });
});
