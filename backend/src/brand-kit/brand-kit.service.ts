import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { asset_type } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

export type BrandKitListItem = {
  id: string;
  name: string;
};

export type BrandKitResourceAsset = {
  id: string;
  name: string;
  type: asset_type;
  url: string;
};

export type BrandKitResourceColor = {
  id: string;
  name: string;
  hex: string;
};

export type BrandKitResourceFont = {
  id: string;
  name: string;
  style: string;
  groupName: string;
  url: string;
};

export type BrandKitResources = {
  brandKit: BrandKitListItem;
  assets: BrandKitResourceAsset[];
  colors: BrandKitResourceColor[];
  fonts: BrandKitResourceFont[];
};

@Injectable()
export class BrandKitService {
  private readonly logger = new Logger(BrandKitService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async getAll(): Promise<BrandKitListItem[]> {
      return this.prisma.brand_kit.findMany({
        where: { deleted_at: null, active: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
        },
      });
  }

  async getResources(brandKitId: string): Promise<BrandKitResources> {
    try {
      const brandKit = await this.prisma.brand_kit.findFirst({
        where: {
          id: brandKitId,
          deleted_at: null,
          active: true,
        },
        select: {
          id: true,
          name: true,
          brandkit_assets: {
            where: {
              deleted_at: null,
              assets: {
                is: {
                  deleted_at: null,
                },
              },
            },
            select: {
              assets: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  bucket: true,
                  object_key: true,
                },
              },
            },
          },
          color_palette: {
            where: {
              deleted_at: null,
              colors: {
                is: {
                  deleted_at: null,
                },
              },
            },
            select: {
              colors: {
                select: {
                  id: true,
                  name: true,
                  hex: true,
                },
              },
            },
          },
          font_groups: {
            select: {
              name: true,
              fonts: {
                where: {
                  deleted_at: null,
                },
                select: {
                  id: true,
                  name: true,
                  style: true,
                  bucket: true,
                  object_key: true,
                },
              },
            },
          },
        },
      });

      if (!brandKit) {
        throw new NotFoundException(
          'No se encontro el brand kit solicitado.',
        );
      }

      const assets = await Promise.all(
        brandKit.brandkit_assets.map(async ({ assets }) => ({
          id: assets.id,
          name: assets.name,
          type: assets.type,
          url: await this.storageService.getSignedUrl(
            assets.bucket,
            assets.object_key,
          ),
        })),
      );

      const fonts = await Promise.all(
        (brandKit.font_groups?.fonts ?? []).map(async (font) => ({
          id: font.id,
          name: font.name,
          style: font.style,
          groupName: brandKit.font_groups?.name ?? '',
          url: await this.storageService.getSignedUrl(
            font.bucket,
            font.object_key,
          ),
        })),
      );

      const colors = brandKit.color_palette.map(({ colors: color }) => ({
        id: color.id,
        name: color.name,
        hex: color.hex,
      }));

      return {
        brandKit: {
          id: brandKit.id,
          name: brandKit.name,
        },
        assets: assets.sort((left, right) => {
          if (left.type !== right.type) {
            return left.type.localeCompare(right.type);
          }

          return left.name.localeCompare(right.name);
        }),
        colors: colors.sort((left, right) => left.name.localeCompare(right.name)),
        fonts: fonts.sort((left, right) => {
          if (left.groupName !== right.groupName) {
            return left.groupName.localeCompare(right.groupName);
          }

          if (left.style !== right.style) {
            return left.style.localeCompare(right.style);
          }

          return left.name.localeCompare(right.name);
        }),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Brand kit resources lookup failed.');

      throw new ServiceUnavailableException(
        'No se pudieron obtener los recursos del brand kit en este momento.',
      );
    }
  }

  create(): string {
    return 'Creando brand kit';
  }

  update(id: string): string {
    return `Actualizando brand kit con id: ${id}`;
  }
}
