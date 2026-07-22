import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { FontsService } from './fonts.service';

function createService() {
  const uploadObjectMock = jest.fn().mockResolvedValue(undefined);
  const getSignedUrlMock = jest
    .fn()
    .mockResolvedValue('http://localhost:9000/ai-newsletter-fonts/fake');
  const prisma = {
    font_groups: {
      upsert: jest.fn().mockResolvedValue({
        id: 'font-group-id',
        name: 'Lumen',
      }),
    },
    fonts: {
      create: jest.fn().mockResolvedValue({
        id: 'font-id',
        name: 'CorporateSans-BoldItalic.ttf',
        style: 'BoldItalic',
        bucket: 'ai-newsletter-fonts',
        object_key: 'fonts/uploads/default-brand/corporatesans-bolditalic-fake.ttf',
        font_groups: {
          name: 'Lumen',
        },
      }),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'seed-font-id',
          name: 'CorporateSans-BoldItalic.ttf',
          style: 'BoldItalic',
          bucket: 'ai-newsletter-fonts',
          object_key: 'fonts/default-brand/CorporateSans-BoldItalic.ttf',
          font_groups: {
            name: 'Lumen',
          },
        },
      ]),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    },
  } as unknown as PrismaService;

  const storageService = {
    uploadObject: uploadObjectMock,
    getSignedUrl: getSignedUrlMock,
    getFontsBucket: jest.fn().mockReturnValue('ai-newsletter-fonts'),
  } as unknown as StorageService;

  return {
    service: new FontsService(prisma, storageService),
    uploadObjectMock,
  };
}

describe('FontsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('uploads valid fonts through the storage service', async () => {
    const { service, uploadObjectMock } = createService();

    await expect(
      service.uploadFonts(
        [
          {
            originalname: 'CorporateSans-BoldItalic.ttf',
            mimetype: 'font/ttf',
            size: 4096,
            buffer: Buffer.from('fake-font'),
          },
        ],
        'Lumen',
      ),
    ).resolves.toEqual({
      fonts: [
        {
          id: 'font-id',
          name: 'CorporateSans-BoldItalic.ttf',
          style: 'BoldItalic',
          groupName: 'Lumen',
          url: 'http://localhost:9000/ai-newsletter-fonts/fake',
        },
      ],
    });

    expect(uploadObjectMock).toHaveBeenCalledWith(
      'ai-newsletter-fonts',
      expect.stringMatching(
        /^fonts\/uploads\/default-brand\/corporatesans-bolditalic-/,
      ),
      Buffer.from('fake-font'),
      'font/ttf',
    );
  });

  it('lists persisted fonts with signed urls', async () => {
    const { service } = createService();

    await expect(service.listFonts('Lumen')).resolves.toEqual({
      fonts: [
        {
          id: 'seed-font-id',
          name: 'CorporateSans-BoldItalic.ttf',
          style: 'BoldItalic',
          groupName: 'Lumen',
          url: 'http://localhost:9000/ai-newsletter-fonts/fake',
        },
      ],
    });
  });

  it('rejects invalid font files', async () => {
    const { service } = createService();

    await expect(
      service.uploadFonts(
        [
          {
            originalname: 'document.pdf',
            mimetype: 'application/pdf',
            size: 1200,
            buffer: Buffer.from('fake'),
          },
        ],
        'Lumen',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
