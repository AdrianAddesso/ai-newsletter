import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { asset_type } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { basename, extname, posix } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { storage_object_source } from '@prisma/client';
import type {
  UploadedAssetFile,
  UploadedAssetDto,
  UploadAssetsResponseDto,
} from './dto/upload-asset.dto';
import { KEYWORD_MAX_CHARS } from '../../../packages/shared/src/enums/assets-config';

type PersistedAsset = {
  id: string;
  name: string;
  created_at: Date;
  type: asset_type;
  bucket: string;
  object_key: string;
};

type SeededAssetInput = {
  name: string;
  type: asset_type;
  storageKey: string;
  description?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | bigint | null;
  fromBrand?: boolean;
};

const userStorageObjectSource: storage_object_source = 'USER';
const systemStorageObjectSource: storage_object_source = 'SYSTEM';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);
  private readonly allowedAssetMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ]);
  private readonly maxAssetSizeBytes = 5 * 1024 * 1024;
  private readonly keywordSvgTemplateCache = new Map<string, Promise<string>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async uploadAssets(
    files: UploadedAssetFile[],
    type: asset_type,
  ): Promise<UploadAssetsResponseDto> {
    try {
      const assets = await Promise.all(
        files.map(async (file) => {
          this.validateAssetFile(file);
          const storageKey = this.createUserUploadStorageKey(
            file.originalname,
            type,
          );

          await this.storageService.uploadObject(
            this.getAssetBucketName(),
            storageKey,
            file.buffer,
            file.mimetype,
          );

          const asset = await this.prisma.assets.create({
            data: {
              name: file.originalname,
              type,
              bucket: this.getAssetBucketName(),
              object_key: storageKey,
              object_prefix: this.getObjectPrefix(storageKey),
              file_name: this.getFileName(storageKey),
              extension: this.getExtension(storageKey),
              mime_type: file.mimetype,
              size_bytes: file.size,
              from_brand: false,
              source: userStorageObjectSource,
            },
            select: {
              id: true,
              name: true,
              created_at: true,
              type: true,
              bucket: true,
              object_key: true,
            },
          });

          return this.toUploadedAssetDto(asset);
        }),
      );

      return { assets };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Asset upload failed.');

      throw new ServiceUnavailableException(
        'No se pudieron cargar los assets en este momento.',
      );
    }
  }

  async listAssets(type?: asset_type): Promise<UploadAssetsResponseDto> {
    try {
      if (type === asset_type.BLOCK) {
        return { assets: [] };
      }

      const assets = await this.prisma.assets.findMany({
        where: type
          ? { type, deleted_at: null }
          : { type: { not: asset_type.BLOCK as asset_type }, deleted_at: null },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          created_at: true,
          type: true,
          bucket: true,
          object_key: true,
        },
      });

      return {
        assets: await Promise.all(
          assets.map((asset) => this.toUploadedAssetDto(asset)),
        ),
      };
    } catch {
      this.logger.error('Asset list failed.');

      throw new ServiceUnavailableException(
        'No se pudieron obtener los assets en este momento.',
      );
    }
  }

  async updateAsset(
    id: string,
    input: { name: string; type: Exclude<asset_type, 'BLOCK'> },
  ): Promise<UploadedAssetDto> {
    const existingAsset = await this.prisma.assets.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: {
        id: true,
        type: true,
        bucket: true,
        object_key: true,
      },
    });

    if (!existingAsset) {
      throw new NotFoundException('No se encontro el asset solicitado.');
    }

    if (existingAsset.type === asset_type.KEYWORD || input.type === asset_type.KEYWORD) {
      this.keywordSvgTemplateCache.delete(
        this.getKeywordSvgTemplateCacheKey(
          existingAsset.bucket,
          existingAsset.object_key,
        ),
      );
    }

    const asset = await this.prisma.assets.update({
      where: {
        id,
      },
      data: {
        name: input.name.trim(),
        type: input.type,
      },
      select: {
        id: true,
        name: true,
        created_at: true,
        type: true,
        bucket: true,
        object_key: true,
      },
    });

    return this.toUploadedAssetDto(asset);
  }

  async deleteAsset(id: string): Promise<void> {
    const existingAsset = await this.prisma.assets.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: {
        id: true,
        type: true,
        bucket: true,
        object_key: true,
      },
    });

    if (!existingAsset) {
      throw new NotFoundException('No se encontro el asset solicitado.');
    }

    if (existingAsset.type === asset_type.KEYWORD) {
      this.keywordSvgTemplateCache.delete(
        this.getKeywordSvgTemplateCacheKey(
          existingAsset.bucket,
          existingAsset.object_key,
        ),
      );
    }

    await this.prisma.assets.update({
      where: {
        id,
      },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  async getBlockPreviewAsset(previewKey: string): Promise<UploadedAssetDto> {
    return this.getSeededAsset(
      `assets/blocks/${this.normalizePreviewKey(previewKey)}`,
      asset_type.IMAGE,
    );
  }

  async getSeededAsset(
    storageKey: string,
    type: asset_type,
  ): Promise<UploadedAssetDto> {
    const normalizedStorageKey = this.normalizeSeededStorageKey(storageKey);
    const fileName = this.getFileName(normalizedStorageKey);

    return this.upsertSeededAsset({
      name: fileName,
      type,
      storageKey: normalizedStorageKey,
      description: `Seeded asset: ${normalizedStorageKey}`,
      mimeType: this.inferMimeType(fileName),
      fromBrand: true,
    });
  }

  async upsertSeededAsset(input: SeededAssetInput): Promise<UploadedAssetDto> {
    if (input.type === asset_type.KEYWORD) {
      this.keywordSvgTemplateCache.delete(
        this.getKeywordSvgTemplateCacheKey(
          this.getAssetBucketName(),
          input.storageKey,
        ),
      );
    }

    const existingAsset = await this.prisma.assets.findFirst({
      where: {
        bucket: this.getAssetBucketName(),
        object_key: input.storageKey,
      },
      select: {
        id: true,
        name: true,
        created_at: true,
        type: true,
        bucket: true,
        object_key: true,
      },
    });

    const asset = existingAsset
      ? await this.prisma.assets.update({
          where: {
            id: existingAsset.id,
          },
          data: {
            name: input.name,
            type: input.type,
            description: input.description ?? null,
            object_prefix: this.getObjectPrefix(input.storageKey),
            file_name: this.getFileName(input.storageKey),
            extension: this.getExtension(input.storageKey),
            mime_type: input.mimeType ?? null,
            size_bytes: input.sizeBytes ?? null,
            from_brand: input.fromBrand ?? true,
            source: systemStorageObjectSource,
          },
          select: {
            id: true,
            name: true,
            created_at: true,
            type: true,
            bucket: true,
            object_key: true,
          },
        })
      : await this.prisma.assets.create({
          data: {
            name: input.name,
            type: input.type,
            bucket: this.getAssetBucketName(),
            object_key: input.storageKey,
            object_prefix: this.getObjectPrefix(input.storageKey),
            file_name: this.getFileName(input.storageKey),
            extension: this.getExtension(input.storageKey),
            description: input.description ?? null,
            mime_type: input.mimeType ?? null,
            size_bytes: input.sizeBytes ?? null,
            from_brand: input.fromBrand ?? true,
            source: systemStorageObjectSource,
          },
          select: {
            id: true,
            name: true,
            created_at: true,
            type: true,
            bucket: true,
            object_key: true,
          },
        });

    return this.toUploadedAssetDto(asset);
  }

  private validateAssetFile(file: UploadedAssetFile): void {
    if (!this.allowedAssetMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(
        'Solo se permiten imagenes JPG, PNG, WebP, GIF o SVG.',
      );
    }

    if (file.size > this.maxAssetSizeBytes) {
      throw new BadRequestException('Cada archivo debe pesar 5 MB o menos.');
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('El archivo cargado esta vacio.');
    }
  }

  private async toUploadedAssetDto(
    asset: PersistedAsset,
  ): Promise<UploadedAssetDto> {
    const keywordSvgTemplate =
      asset.type === asset_type.KEYWORD
        ? await this.getKeywordSvgTemplate(asset.bucket, asset.object_key)
        : null;

    return {
      id: asset.id,
      name: asset.name,
      created_at: asset.created_at.toISOString(),
      type: asset.type,
      url: await this.storageService.getSignedUrl(
        asset.bucket,
        asset.object_key,
      ),
      svgTemplate: keywordSvgTemplate,
      maxChars: keywordSvgTemplate ? KEYWORD_MAX_CHARS : null,
    };
  }

  private async getKeywordSvgTemplate(
    bucket: string,
    objectKey: string,
  ): Promise<string> {
    const cacheKey = this.getKeywordSvgTemplateCacheKey(bucket, objectKey);
    const cachedTemplate = this.keywordSvgTemplateCache.get(cacheKey);

    if (cachedTemplate) {
      return cachedTemplate;
    }

    // Cache promises to deduplicate concurrent reads for the same keyword SVG.
    const templatePromise = this.storageService
      .getObjectText(bucket, objectKey)
      .catch((error: unknown) => {
        this.keywordSvgTemplateCache.delete(cacheKey);
        throw error;
      });

    this.keywordSvgTemplateCache.set(cacheKey, templatePromise);
    return templatePromise;
  }

  private getKeywordSvgTemplateCacheKey(
    bucket: string,
    objectKey: string,
  ): string {
    return `${bucket}:${objectKey}`;
  }

  private getAssetBucketName(): string {
    return this.storageService.getAssetsBucket();
  }

  private createUserUploadStorageKey(
    fileName: string,
    type: asset_type,
  ): string {
    const safeExtension = extname(fileName).toLowerCase();
    const normalizedBaseName = this.normalizePathSegment(
      basename(fileName, safeExtension),
    );
    return `assets/uploads/${type.toLowerCase()}/${normalizedBaseName}-${randomUUID()}${safeExtension}`;
  }

  private normalizePathSegment(value: string): string {
    return (
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'asset'
    );
  }

  private normalizePreviewKey(previewKey: string): string {
    const normalizedPreviewKey = basename(previewKey.trim());

    if (!normalizedPreviewKey || normalizedPreviewKey !== previewKey.trim()) {
      throw new BadRequestException(
        'Debe indicar una imagen de preview valida.',
      );
    }

    const extension = extname(normalizedPreviewKey).toLowerCase();

    if (
      !['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(extension)
    ) {
      throw new BadRequestException(
        'Debe indicar una imagen de preview valida.',
      );
    }

    return normalizedPreviewKey;
  }

  private normalizeSeededStorageKey(storageKey: string): string {
    const trimmedStorageKey = storageKey.trim().replace(/\\/g, '/');
    const normalizedStorageKey = posix.normalize(trimmedStorageKey);

    if (
      !normalizedStorageKey.startsWith('assets/') ||
      normalizedStorageKey !== trimmedStorageKey ||
      normalizedStorageKey.includes('/../')
    ) {
      throw new BadRequestException('Debe indicar un asset valido.');
    }

    const extension = extname(normalizedStorageKey).toLowerCase();

    if (
      !['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(extension)
    ) {
      throw new BadRequestException('Debe indicar un asset valido.');
    }

    return normalizedStorageKey;
  }

  private inferMimeType(fileName: string): string | null {
    const extension = extname(fileName).toLowerCase();

    const mimeTypesByExtension: Record<string, string> = {
      '.gif': 'image/gif',
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
    };

    return mimeTypesByExtension[extension] ?? null;
  }

  private getObjectPrefix(storageKey: string): string {
    const objectPrefix = posix.dirname(storageKey);
    return objectPrefix === '.' ? '' : objectPrefix;
  }

  private getFileName(storageKey: string): string {
    return basename(storageKey);
  }

  private getExtension(storageKey: string): string | null {
    const extension = extname(storageKey).toLowerCase();
    return extension ? extension.slice(1) : null;
  }
}
