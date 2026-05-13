import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { BrandKitService } from './brand-kit.service';

function createService() {
  const prisma = {
    brand_kit: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'cc8f4470-16d2-4a71-b8e5-c73c05abef3a',
          name: 'Nestle',
        },
      ]),
      findFirst: jest.fn().mockResolvedValue({
        id: 'cc8f4470-16d2-4a71-b8e5-c73c05abef3a',
        name: 'Nestle',
        brandkit_assets: [
          {
            assets: {
              id: 'shape-id',
              name: 'dark-green.svg',
              type: 'SHAPE',
              bucket: 'assets-bucket',
              object_key: 'assets/shapes/brand/nestle/dark-green.svg',
            },
          },
          {
            assets: {
              id: 'logo-id',
              name: 'logo-white.svg',
              type: 'LOGO',
              bucket: 'assets-bucket',
              object_key: 'assets/logos/nestle/logo-white.svg',
            },
          },
        ],
        color_palette: [
          {
            colors: {
              id: 'color-b',
              name: 'Yellow Light',
              hex: '#FFC600',
            },
          },
          {
            colors: {
              id: 'color-a',
              name: 'Blue Dark',
              hex: '#00A0DF',
            },
          },
        ],
        font_groups: {
          name: 'Nestle',
          fonts: [
            {
              id: 'font-b',
              name: 'NestleTextTF-Bold.ttf',
              style: 'Bold',
              bucket: 'fonts-bucket',
              object_key: 'fonts/nestle/bold.ttf',
            },
            {
              id: 'font-a',
              name: 'NestleTextTF-Book.ttf',
              style: 'Book',
              bucket: 'fonts-bucket',
              object_key: 'fonts/nestle/book.ttf',
            },
          ],
        },
      }),
    },
  } as unknown as PrismaService;

  const storageService = {
    getSignedUrl: jest
      .fn()
      .mockImplementation((bucket: string, objectKey: string) =>
        Promise.resolve(`https://signed.example/${bucket}/${objectKey}`),
      ),
  } as unknown as StorageService;

  return {
    service: new BrandKitService(prisma, storageService),
    prisma,
    storageService,
  };
}

describe('BrandKitService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns brand kit resources with signed urls and stable ordering', async () => {
    const { service } = createService();

    await expect(
      service.getResources('cc8f4470-16d2-4a71-b8e5-c73c05abef3a'),
    ).resolves.toEqual({
      brandKit: {
        id: 'cc8f4470-16d2-4a71-b8e5-c73c05abef3a',
        name: 'Nestle',
      },
      assets: [
        {
          id: 'logo-id',
          name: 'logo-white.svg',
          type: 'LOGO',
          url: 'https://signed.example/assets-bucket/assets/logos/nestle/logo-white.svg',
        },
        {
          id: 'shape-id',
          name: 'dark-green.svg',
          type: 'SHAPE',
          url: 'https://signed.example/assets-bucket/assets/shapes/brand/nestle/dark-green.svg',
        },
      ],
      colors: [
        {
          id: 'color-a',
          name: 'Blue Dark',
          hex: '#00A0DF',
        },
        {
          id: 'color-b',
          name: 'Yellow Light',
          hex: '#FFC600',
        },
      ],
      fonts: [
        {
          id: 'font-b',
          name: 'NestleTextTF-Bold.ttf',
          style: 'Bold',
          groupName: 'Nestle',
          url: 'https://signed.example/fonts-bucket/fonts/nestle/bold.ttf',
        },
        {
          id: 'font-a',
          name: 'NestleTextTF-Book.ttf',
          style: 'Book',
          groupName: 'Nestle',
          url: 'https://signed.example/fonts-bucket/fonts/nestle/book.ttf',
        },
      ],
    });
  });

  it('throws not found when the brand kit does not exist', async () => {
    const { service, prisma } = createService();

    prisma.brand_kit.findFirst = jest.fn().mockResolvedValue(null);

    await expect(
      service.getResources('00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
