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
  let getSignedUrlMock: jest.Mock;

  beforeEach(() => {
    const configService = {
      get: (key: string) =>
        ({
          OBJECT_STORAGE_ENDPOINT: 'http://localhost:9000',
          OBJECT_STORAGE_PUBLIC_ENDPOINT: 'http://public-storage.example:9000',
          OBJECT_STORAGE_REGION: 'us-east-1',
          OBJECT_STORAGE_ASSETS_BUCKET: 'ai-newsletter-assets',
          OBJECT_STORAGE_FONTS_BUCKET: 'ai-newsletter-fonts',
          OBJECT_STORAGE_EXPORTS_BUCKET: 'ai-newsletter-exports',
          OBJECT_STORAGE_ACCESS_KEY: 'storage-user',
          OBJECT_STORAGE_SECRET_KEY: 'storage-password',
          OBJECT_STORAGE_FORCE_PATH_STYLE: 'true',
        })[key],
    } as ConfigService;

    service = new StorageService(configService);
    sendMock = jest
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue({} as never);
    getSignedUrlMock = getSignedUrl as jest.Mock;
    getSignedUrlMock.mockResolvedValue(
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

  it('signs browser-facing urls with the public endpoint when configured', async () => {
    await service.getSignedUrl(
      'ai-newsletter-assets',
      'ai-assets/test.png',
    );

    const signedUrlClient = getSignedUrlMock.mock.calls[0]?.[0] as S3Client;
    const endpoint = await signedUrlClient.config.endpoint?.();

    expect(endpoint?.hostname).toBe('public-storage.example');
    expect(endpoint?.port).toBe(9000);
  });
});
