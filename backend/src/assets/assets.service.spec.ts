import { BadRequestException, NotFoundException } from '@nestjs/common';
import { asset_type } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AssetsService } from './assets.service';
import type { UploadedAssetFile } from './dto/upload-asset.dto';
import { KEYWORD_MAX_CHARS } from '../../../packages/shared/src/enums/assets-config';

const createdAt = new Date('2026-05-23T12:00:00.000Z');
const createdAtIso = createdAt.toISOString();
const updatedAt = new Date('2026-05-23T12:00:00.000Z');
const updatedAtIso = updatedAt.toISOString();

type AssetCreateInput = {
  data: {
    name: string;
    description: string | null;
    type: asset_type;
    source: string;
    from_brand: boolean;
  };
};

function createService() {
  const uploadObjectMock = jest.fn().mockResolvedValue(undefined);
  const getSignedUrlMock = jest
    .fn()
    .mockResolvedValue('http://localhost:9000/ai-newsletter-assets/fake');
  const getObjectTextMock = jest.fn().mockResolvedValue('<svg><g id="Text" /></svg>');
  const createAssetMock = jest.fn<Promise<unknown>, [AssetCreateInput]>().mockResolvedValue({
    id: 'asset-id',
    name: 'banner.png',
    description: null,
    created_at: createdAt,
    updated_at: updatedAt,
    type: 'IMAGE',
    bucket: 'ai-newsletter-assets',
    object_key: 'assets/uploads/image/banner-fake.png',
  });
  const updateAssetMock = jest.fn();
  const prisma = {
    assets: {
      create: createAssetMock,
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'seed-asset-id',
          name: 'dark-green.svg',
          description: null,
          created_at: createdAt,
          updated_at: updatedAt,
          type: 'SHAPE',
          bucket: 'ai-newsletter-assets',
          object_key:
            'assets/brand_shapes/isolated-by-brand/maggi/bottle/dark-green.svg',
        },
      ]),
      findFirst: jest.fn().mockResolvedValue(null),
      update: updateAssetMock,
    },
    brand_kit: {
      findFirst: jest.fn().mockResolvedValue({ id: 'brand-kit-id' }),
    },
  } as unknown as PrismaService;

  const storageService = {
    uploadObject: uploadObjectMock,
    getSignedUrl: getSignedUrlMock,
    getObjectText: getObjectTextMock,
    getAssetsBucket: jest
      .fn()
      .mockReturnValue('ai-newsletter-assets'),
  } as unknown as StorageService;

  return {
      service: new AssetsService(prisma, storageService),
      uploadObjectMock,
      getSignedUrlMock,
      getObjectTextMock,
      updateAssetMock,
      createAssetMock,
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
          description: null,
          created_at: createdAtIso,
          updated_at: updatedAtIso,
          type: 'IMAGE',
          url: 'http://localhost:9000/ai-newsletter-assets/fake',
          svgTemplate: null,
          maxChars: null,
        },
      ],
    });

    expect(uploadObjectMock).toHaveBeenCalledWith(
      'ai-newsletter-assets',
      expect.stringMatching(/^assets\/uploads\/image\/banner-/),
      Buffer.from('fake'),
      'image/png',
    );
  });

  it('uploads a single asset with explicit metadata', async () => {
    const { service, createAssetMock } = createService();

    await service.uploadAssets([
      {
        originalname: 'banner.png',
        mimetype: 'image/png',
        size: 1200,
        buffer: Buffer.from('fake'),
      },
    ], 'IMAGE', {
      name: 'Banner principal',
      description: 'Imagen para header',
    });

    const createCall = createAssetMock.mock.calls[0]?.[0];

    expect(createCall).toBeDefined();

    expect(createCall?.data).toMatchObject({
      name: 'Banner principal',
      description: 'Imagen para header',
      type: 'IMAGE',
      source: 'USER',
      from_brand: false,
    });
  });

  it('lists persisted assets with signed urls', async () => {
    const { service, prisma } = createService();

    await expect(service.listAssets('SHAPE')).resolves.toEqual({
      assets: [
        {
          id: 'seed-asset-id',
          name: 'dark-green.svg',
          description: null,
          created_at: createdAtIso,
          updated_at: updatedAtIso,
          type: 'SHAPE',
          url: 'http://localhost:9000/ai-newsletter-assets/fake',
          svgTemplate: null,
          maxChars: null,
        },
      ],
    });

    expect(prisma.assets.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: 'SHAPE',
          deleted_at: null,
        }),
      }),
    );
  });

  it('keeps brand kit filtering when a brand kit id is provided', async () => {
    const { service, prisma } = createService();

    await service.listAssets('SHAPE', 'brand-kit-id');

    expect(prisma.assets.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deleted_at: null,
          type: 'SHAPE',
          brandkit_assets: {
            some: {
              brand_kit_id: 'brand-kit-id',
              deleted_at: null,
            },
          },
        },
      }),
    );
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
        },
      ], 'IMAGE'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates persisted asset metadata', async () => {
    const { service, prisma, updateAssetMock } = createService();

    (prisma.assets.findFirst as jest.Mock).mockResolvedValue({
      id: 'asset-id',
      type: asset_type.IMAGE,
      bucket: 'ai-newsletter-assets',
      object_key: 'assets/uploads/image/banner-fake.png',
    });
    updateAssetMock.mockResolvedValue({
      id: 'asset-id',
      name: 'Updated banner',
      description: 'Updated description',
      created_at: createdAt,
      updated_at: updatedAt,
      type: asset_type.LOGO,
      bucket: 'ai-newsletter-assets',
      object_key: 'assets/uploads/image/banner-fake.png',
    });

    await expect(
      service.updateAsset('asset-id', {
      name: ' Updated banner ',
      description: ' Updated description ',
      type: asset_type.LOGO,
      }),
    ).resolves.toEqual({
      id: 'asset-id',
      name: 'Updated banner',
      description: 'Updated description',
      created_at: createdAtIso,
      updated_at: updatedAtIso,
      type: asset_type.LOGO,
      url: 'http://localhost:9000/ai-newsletter-assets/fake',
      svgTemplate: null,
      maxChars: null,
    });

    expect(updateAssetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'Updated banner',
          description: 'Updated description',
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
      bucket: 'ai-newsletter-assets',
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

  it('returns seeded assets without mutating persisted metadata', async () => {
    const { service, prisma, createAssetMock, updateAssetMock } = createService();

    (prisma.assets.findFirst as jest.Mock).mockResolvedValue({
      id: 'block-asset-id',
      name: 'HeaderFullRenderer.svg',
      description: 'Seeded asset: assets/blocks/HeaderFullRenderer.svg',
      created_at: createdAt,
      updated_at: updatedAt,
      type: asset_type.BLOCK,
      bucket: 'ai-newsletter-assets',
      object_key: 'assets/blocks/HeaderFullRenderer.svg',
    });

    await expect(
      service.getSeededAsset(
        'assets/blocks/HeaderFullRenderer.svg',
        asset_type.BLOCK,
      ),
    ).resolves.toEqual({
      id: 'block-asset-id',
      name: 'HeaderFullRenderer.svg',
      description: 'Seeded asset: assets/blocks/HeaderFullRenderer.svg',
      created_at: createdAtIso,
      updated_at: updatedAtIso,
      type: asset_type.BLOCK,
      url: 'http://localhost:9000/ai-newsletter-assets/fake',
      svgTemplate: null,
      maxChars: null,
    });

    expect(createAssetMock).not.toHaveBeenCalled();
    expect(updateAssetMock).not.toHaveBeenCalled();
  });

  it('rejects missing seeded assets', async () => {
    const { service } = createService();

    await expect(
      service.getSeededAsset(
        'assets/blocks/MissingRenderer.svg',
        asset_type.BLOCK,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('caches keyword svg templates across repeated reads', async () => {
    const { service, prisma, getObjectTextMock } = createService();

    (prisma.assets.findMany as jest.Mock).mockResolvedValue([
      {
          id: 'keyword-asset-id',
          name: 'keyword-template.svg',
          description: null,
          created_at: createdAt,
        updated_at: updatedAt,
        type: 'KEYWORD',
        bucket: 'ai-newsletter-assets',
        object_key: 'assets/keywords/keyword-template.svg',
      },
    ]);

    await expect(service.listAssets('KEYWORD')).resolves.toEqual({
      assets: [
        {
          id: 'keyword-asset-id',
          name: 'keyword-template.svg',
          description: null,
          created_at: createdAtIso,
          updated_at: updatedAtIso,
          type: 'KEYWORD',
          url: 'http://localhost:9000/ai-newsletter-assets/fake',
          svgTemplate: '<svg><g id="Text" /></svg>',
          maxChars: KEYWORD_MAX_CHARS,
        },
      ],
    });

    await service.listAssets('KEYWORD');

    expect(getObjectTextMock).toHaveBeenCalledTimes(1);
  });
});
