import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { asset_type } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { KEYWORD_MAX_CHARS } from '../../../packages/shared/src/enums/assets-config';
import type {
  CreateBrandKitBody,
  CreateBrandKitColorBody,
  UpdateBrandKitBody,
  UpdateBrandKitColorBody,
} from './brand-kit.schemas';

export type BrandKitListItem = {
  id: string;
  name: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  font_group_id: string | null;
};

export type BrandKitDetail = BrandKitListItem;

export type BrandKitResourceAsset = {
  id: string;
  name: string;
  type: asset_type;
  url: string;
  svgTemplate?: string | null;
  maxChars?: number | null;
  keywordText?: string | null;
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
  file_name: string;
  extension: string | null;
  size_bytes: number | null;
  created_at: Date;
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
  private readonly keywordSvgTemplateCache = new Map<string, Promise<string>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async getAll(includeInactive = false): Promise<BrandKitListItem[]> {
    return this.prisma.brand_kit.findMany({
      where: {
        deleted_at: null,
        ...(includeInactive ? {} : { active: true }),
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        active: true,
        created_at: true,
        updated_at: true,
        font_group_id: true,
      },
    });
  }

  async getById(id: string): Promise<BrandKitDetail> {
    const brandKit = await this.prisma.brand_kit.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        active: true,
        created_at: true,
        updated_at: true,
        font_group_id: true,
      },
    });

    if (!brandKit) {
      throw new NotFoundException('No se encontro el brand kit solicitado.');
    }

    return brandKit;
  }

  async getResources(brandKitId: string): Promise<BrandKitResources> {
    try {
      const brandKit = await this.prisma.brand_kit.findFirst({
        where: {
          id: brandKitId,
          deleted_at: null,
        },
        select: {
          id: true,
          name: true,
          active: true,
          created_at: true,
          updated_at: true,
          font_group_id: true,
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
                  file_name: true,
                  extension: true,
                  size_bytes: true,
                  created_at: true,
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
          svgTemplate:
            assets.type === asset_type.KEYWORD
              ? await this.getKeywordSvgTemplate(assets.bucket, assets.object_key)
              : null,
          maxChars:
            assets.type === asset_type.KEYWORD ? KEYWORD_MAX_CHARS : null,
          keywordText: null,
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
          file_name: font.file_name,
          extension: font.extension,
          size_bytes:
            typeof font.size_bytes === 'bigint'
              ? Number(font.size_bytes)
              : font.size_bytes,
          created_at: font.created_at,
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
          active: brandKit.active,
          created_at: brandKit.created_at,
          updated_at: brandKit.updated_at,
          font_group_id: brandKit.font_group_id,
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

  async create(body: CreateBrandKitBody): Promise<BrandKitDetail> {
    const normalizedName = body.name.trim();
    await this.assertUniqueBrandKitName(normalizedName);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (body.active) {
          await tx.brand_kit.updateMany({
            where: {
              deleted_at: null,
              active: true,
            },
            data: {
              active: false,
            },
          });
        }

        const createdBrandKit = await tx.brand_kit.create({
          data: {
            name: normalizedName,
            active: body.active ?? true,
            created_by_user_id: body.createdByUserId ?? null,
          },
          select: {
            id: true,
          },
        });

        const fontGroup = await tx.font_groups.create({
          data: {
            name: `brandkit-${createdBrandKit.id}`,
          },
          select: {
            id: true,
          },
        });

        await tx.brand_kit.update({
          where: {
            id: createdBrandKit.id,
          },
          data: {
            font_group_id: fontGroup.id,
          },
        });

        return this.requireBrandKitDetail(tx, createdBrandKit.id);
      });
    } catch (error) {
      this.rethrowKnownError(error);
      this.logger.error('Brand kit creation failed.');
      throw new ServiceUnavailableException(
        'No se pudo crear el brand kit en este momento.',
      );
    }
  }

  async update(id: string, body: UpdateBrandKitBody): Promise<BrandKitDetail> {
    await this.ensureBrandKitExists(id);

    const normalizedName = body.name?.trim();
    if (normalizedName) {
      await this.assertUniqueBrandKitName(normalizedName, id);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (body.active) {
          await tx.brand_kit.updateMany({
            where: {
              deleted_at: null,
              active: true,
              id: {
                not: id,
              },
            },
            data: {
              active: false,
            },
          });
        }

        await tx.brand_kit.update({
          where: {
            id,
          },
          data: {
            ...(normalizedName ? { name: normalizedName } : {}),
            ...(typeof body.active === 'boolean' ? { active: body.active } : {}),
          },
        });

        return this.requireBrandKitDetail(tx, id);
      });
    } catch (error) {
      this.rethrowKnownError(error);
      this.logger.error('Brand kit update failed.');
      throw new ServiceUnavailableException(
        'No se pudo actualizar el brand kit en este momento.',
      );
    }
  }

  async delete(id: string): Promise<void> {
    await this.ensureBrandKitExists(id);

    try {
      await this.prisma.brand_kit.update({
        where: {
          id,
        },
        data: {
          deleted_at: new Date(),
          active: false,
        },
      });
    } catch {
      this.logger.error('Brand kit deletion failed.');
      throw new ServiceUnavailableException(
        'No se pudo eliminar el brand kit en este momento.',
      );
    }
  }

  async createColor(
    brandKitId: string,
    body: CreateBrandKitColorBody,
  ): Promise<BrandKitResourceColor> {
    await this.ensureBrandKitExists(brandKitId);
    await this.assertUniqueColorHex(body.hex);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const color = await tx.colors.create({
          data: {
            name: body.name.trim(),
            hex: body.hex.trim().toUpperCase(),
          },
          select: {
            id: true,
            name: true,
            hex: true,
          },
        });

        await tx.color_palette.create({
          data: {
            brand_kit_id: brandKitId,
            color_id: color.id,
          },
        });

        return color;
      });
    } catch (error) {
      this.rethrowKnownError(error);
      this.logger.error('Brand kit color creation failed.');
      throw new ServiceUnavailableException(
        'No se pudo crear el color del brand kit en este momento.',
      );
    }
  }

  async updateColor(
    brandKitId: string,
    colorId: string,
    body: UpdateBrandKitColorBody,
  ): Promise<BrandKitResourceColor> {
    await this.ensureBrandKitColorExists(brandKitId, colorId);
    await this.assertUniqueColorHex(body.hex, colorId);

    try {
      return await this.prisma.colors.update({
        where: {
          id: colorId,
        },
        data: {
          name: body.name.trim(),
          hex: body.hex.trim().toUpperCase(),
        },
        select: {
          id: true,
          name: true,
          hex: true,
        },
      });
    } catch (error) {
      this.rethrowKnownError(error);
      this.logger.error('Brand kit color update failed.');
      throw new ServiceUnavailableException(
        'No se pudo actualizar el color del brand kit en este momento.',
      );
    }
  }

  async deleteColor(brandKitId: string, colorId: string): Promise<void> {
    await this.ensureBrandKitColorExists(brandKitId, colorId);

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.color_palette.update({
          where: {
            brand_kit_id_color_id: {
              brand_kit_id: brandKitId,
              color_id: colorId,
            },
          },
          data: {
            deleted_at: new Date(),
          },
        });

        const activeRelations = await tx.color_palette.count({
          where: {
            color_id: colorId,
            deleted_at: null,
          },
        });

        if (activeRelations === 0) {
          await tx.colors.update({
            where: {
              id: colorId,
            },
            data: {
              deleted_at: new Date(),
            },
          });
        }
      });
    } catch {
      this.logger.error('Brand kit color deletion failed.');
      throw new ServiceUnavailableException(
        'No se pudo eliminar el color del brand kit en este momento.',
      );
    }
  }

  async linkAssetByBrandKitName(
    brandKitName: string,
    assetId: string,
  ): Promise<void> {
    const brandKit = await this.prisma.brand_kit.findFirst({
      where: {
        name: brandKitName,
        deleted_at: null,
      },
      select: {
        id: true,
      },
    });

    if (!brandKit) {
      throw new NotFoundException('No se encontro el brand kit solicitado.');
    }

    await this.prisma.brandkit_assets.createMany({
      data: [
        {
          brand_kit_id: brandKit.id,
          asset_id: assetId,
        },
      ],
      skipDuplicates: true,
    });
  }

  private async ensureBrandKitExists(id: string): Promise<void> {
    const brandKit = await this.prisma.brand_kit.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: {
        id: true,
      },
    });

    if (!brandKit) {
      throw new NotFoundException('No se encontro el brand kit solicitado.');
    }
  }

  private async ensureBrandKitColorExists(
    brandKitId: string,
    colorId: string,
  ): Promise<void> {
    const colorBinding = await this.prisma.color_palette.findFirst({
      where: {
        brand_kit_id: brandKitId,
        color_id: colorId,
        deleted_at: null,
        brand_kit: {
          deleted_at: null,
        },
        colors: {
          deleted_at: null,
        },
      },
      select: {
        color_id: true,
      },
    });

    if (!colorBinding) {
      throw new NotFoundException(
        'No se encontro el color asociado al brand kit solicitado.',
      );
    }
  }

  private async assertUniqueBrandKitName(
    name: string,
    currentBrandKitId?: string,
  ): Promise<void> {
    const existingBrandKit = await this.prisma.brand_kit.findFirst({
      where: {
        deleted_at: null,
        name,
        ...(currentBrandKitId
          ? {
              id: {
                not: currentBrandKitId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingBrandKit) {
      throw new BadRequestException(
        'Ya existe un brand kit con ese nombre.',
      );
    }
  }

  private async assertUniqueColorHex(
    hex: string,
    currentColorId?: string,
  ): Promise<void> {
    const existingColor = await this.prisma.colors.findFirst({
      where: {
        deleted_at: null,
        hex: hex.trim().toUpperCase(),
        ...(currentColorId
          ? {
              id: {
                not: currentColorId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingColor) {
      throw new BadRequestException(
        'Ya existe un color con ese codigo HEX.',
      );
    }
  }

  private async requireBrandKitDetail(
    tx: PrismaService | Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    id: string,
  ): Promise<BrandKitDetail> {
    const brandKit = await tx.brand_kit.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        active: true,
        created_at: true,
        updated_at: true,
        font_group_id: true,
      },
    });

    if (!brandKit) {
      throw new NotFoundException('No se encontro el brand kit solicitado.');
    }

    return brandKit;
  }

  private rethrowKnownError(error: unknown): void {
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }
  }

  private async getKeywordSvgTemplate(
    bucket: string,
    objectKey: string,
  ): Promise<string> {
    const cacheKey = `${bucket}:${objectKey}`;
    const cachedTemplate = this.keywordSvgTemplateCache.get(cacheKey);

    if (cachedTemplate) {
      return cachedTemplate;
    }

    const templatePromise = this.storageService
      .getObjectText(bucket, objectKey)
      .catch((error: unknown) => {
        this.keywordSvgTemplateCache.delete(cacheKey);
        throw error;
      });

    this.keywordSvgTemplateCache.set(cacheKey, templatePromise);
    return templatePromise;
  }
}
