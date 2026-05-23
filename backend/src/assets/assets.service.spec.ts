import { BadRequestException, NotFoundException } from '@nestjs/common';
import { asset_type } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AssetsService } from './assets.service';
import type { UploadedAssetFile } from './dto/upload-asset.dto';
import { KEYWORD_MAX_CHARS } from '../../../packages/shared/src/enums/assets-config';

const createdAt = new Date('2026-05-23T12:00:00.000Z');
const createdAtIso = createdAt.toISOString();

function createService() {
  const uploadObjectMock = jest.fn().mockResolvedValue(undefined);
  const getSignedUrlMock = jest
    .fn()
    .mockResolvedValue('http://localhost:9000/nestle-ai-newsletter-assets/fake');
  const getObjectTextMock = jest.fn().mockResolvedValue('<svg><g id="Text" /></svg>');
  const updateAssetMock = jest.fn();
  const prisma = {
    assets: {
      create: jest.fn().mockResolvedValue({
        id: 'asset-id',
        name: 'banner.png',
        created_at: createdAt,
        type: 'IMAGE',
        bucket: 'nestle-ai-newsletter-assets',
        object_key: 'assets/uploads/image/banner-fake.png',
      }),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'seed-asset-id',
          name: 'dark-green.svg',
          created_at: createdAt,
          type: 'SHAPE',
          bucket: 'nestle-ai-newsletter-assets',
          object_key:
            'assets/brand_shapes/isolated-by-brand/maggi/bottle/dark-green.svg',
        },
      ]),
      findFirst: jest.fn().mockResolvedValue(null),
      update: updateAssetMock,
    },
  } as unknown as PrismaService;

  const storageService = {
    uploadObject: uploadObjectMock,
    getSignedUrl: getSignedUrlMock,
    getObjectText: getObjectTextMock,
    getAssetsBucket: jest
      .fn()
      .mockReturnValue('nestle-ai-newsletter-assets'),
  } as unknown as StorageService;

  return {
      service: new AssetsService(prisma, storageService),
      uploadObjectMock,
      getSignedUrlMock,
      getObjectTextMock,
      updateAssetMock,
      prisma,
  };
}

describe('AssetsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('uploads valid assets through the storage service', async () => {
    const { service, uploadObjectMock } = createService();

    await expect(
      service.uploadAssets([
        {
          originalname: 'banner.png',
          mimetype: 'image/png',
          size: 1200,
          buffer: Buffer.from('fake'),
        },
      ], 'IMAGE'),
    ).resolves.toEqual({
      assets: [
        {
          id: 'asset-id',
          name: 'banner.png',
          created_at: createdAtIso,
          type: 'IMAGE',
          url: 'http://localhost:9000/nestle-ai-newsletter-assets/fake',
          svgTemplate: null,
          maxChars: null,
        },
      ],
    });

    expect(uploadObjectMock).toHaveBeenCalledWith(
      'nestle-ai-newsletter-assets',
      expect.stringMatching(/^assets\/uploads\/image\/banner-/),
      Buffer.from('fake'),
      'image/png',
    );
  });

  it('lists persisted assets with signed urls', async () => {
    const { service } = createService();

    await expect(service.listAssets('SHAPE')).resolves.toEqual({
      assets: [
        {
          id: 'seed-asset-id',
          name: 'dark-green.svg',
          created_at: createdAtIso,
          type: 'SHAPE',
          url: 'http://localhost:9000/nestle-ai-newsletter-assets/fake',
          svgTemplate: null,
          maxChars: null,
        },
      ],
    });
  });

  it('excludes block assets from list responses', async () => {
    const { service } = createService();

    await expect(service.listAssets('BLOCK')).resolves.toEqual({ assets: [] });
  });

  it('rejects invalid asset files', async () => {
    const { service } = createService();

    await expect(
      service.uploadAssets([
        {
          originalname: 'document.pdf',
          mimetype: 'application/pdf',
          size: 1200,
          buffer: Buffer.from('fake'),
        } as UploadedAssetFile,
      ], 'IMAGE'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates persisted asset metadata', async () => {
    const { service, prisma, updateAssetMock } = createService();

    (prisma.assets.findFirst as jest.Mock).mockResolvedValue({
      id: 'asset-id',
      type: asset_type.IMAGE,
      bucket: 'nestle-ai-newsletter-assets',
      object_key: 'assets/uploads/image/banner-fake.png',
    });
    updateAssetMock.mockResolvedValue({
      id: 'asset-id',
      name: 'Updated banner',
      created_at: createdAt,
      type: asset_type.LOGO,
      bucket: 'nestle-ai-newsletter-assets',
      object_key: 'assets/uploads/image/banner-fake.png',
    });

    await expect(
      service.updateAsset('asset-id', {
        name: ' Updated banner ',
        type: asset_type.LOGO,
      }),
    ).resolves.toEqual({
      id: 'asset-id',
      name: 'Updated banner',
      created_at: createdAtIso,
      type: asset_type.LOGO,
      url: 'http://localhost:9000/nestle-ai-newsletter-assets/fake',
      svgTemplate: null,
      maxChars: null,
    });

    expect(updateAssetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'Updated banner',
          type: asset_type.LOGO,
        },
      }),
    );
  });

  it('soft deletes persisted assets', async () => {
    const { service, prisma, updateAssetMock } = createService();

    (prisma.assets.findFirst as jest.Mock).mockResolvedValue({
      id: 'asset-id',
      type: asset_type.IMAGE,
      bucket: 'nestle-ai-newsletter-assets',
      object_key: 'assets/uploads/image/banner-fake.png',
    });
    updateAssetMock.mockResolvedValue({
      id: 'asset-id',
    });

    await expect(service.deleteAsset('asset-id')).resolves.toBeUndefined();

    expect(updateAssetMock).toHaveBeenCalledWith({
      where: {
        id: 'asset-id',
      },
      data: {
        deleted_at: expect.any(Date) as Date,
      },
    });
  });

  it('rejects updates for missing assets', async () => {
    const { service } = createService();

    await expect(
      service.updateAsset('missing-id', {
        name: 'Missing asset',
        type: asset_type.IMAGE,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('caches keyword svg templates across repeated reads', async () => {
    const { service, prisma, getObjectTextMock } = createService();

    (prisma.assets.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'keyword-asset-id',
        name: 'keyword-template.svg',
        created_at: createdAt,
        type: 'KEYWORD',
        bucket: 'nestle-ai-newsletter-assets',
        object_key: 'assets/keywords/keyword-template.svg',
      },
    ]);

    await expect(service.listAssets('KEYWORD')).resolves.toEqual({
      assets: [
        {
          id: 'keyword-asset-id',
          name: 'keyword-template.svg',
          created_at: createdAtIso,
          type: 'KEYWORD',
          url: 'http://localhost:9000/nestle-ai-newsletter-assets/fake',
          svgTemplate: '<svg><g id="Text" /></svg>',
          maxChars: KEYWORD_MAX_CHARS,
        },
      ],
    });

    await service.listAssets('KEYWORD');

    expect(getObjectTextMock).toHaveBeenCalledTimes(1);
  });
});
