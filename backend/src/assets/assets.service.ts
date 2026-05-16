import {
  BadRequestException,
  Injectable,
  Logger,
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

type PersistedAsset = {
  id: string;
  name: string;
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
const keywordMaxChars = 20;

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
      const assets = await this.prisma.assets.findMany({
        where: type ? { type } : undefined,
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
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

  async upsertSeededAsset(
    input: SeededAssetInput,
  ): Promise<UploadedAssetDto> {
    const existingAsset = await this.prisma.assets.findFirst({
      where: {
        bucket: this.getAssetBucketName(),
        object_key: input.storageKey,
      },
      select: {
        id: true,
        name: true,
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
      throw new BadRequestException(
        'Cada archivo debe pesar 5 MB o menos.',
      );
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
      type: asset.type,
      url: await this.storageService.getSignedUrl(asset.bucket, asset.object_key),
      svgTemplate: keywordSvgTemplate,
      maxChars: keywordSvgTemplate ? keywordMaxChars : null,
    };
  }

  private async getKeywordSvgTemplate(
    bucket: string,
    objectKey: string,
  ): Promise<string> {
    return this.storageService.getObjectText(bucket, objectKey);
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
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'asset';
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
