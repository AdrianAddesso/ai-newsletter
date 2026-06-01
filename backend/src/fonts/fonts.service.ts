import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { basename, extname, posix } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { storage_object_source } from '@prisma/client';
import type {
  UploadedFontDto,
  UploadedFontFile,
  UploadedFontUpdateDto,
  UploadFontsResponseDto,
} from './dto/upload-font.dto';

type PersistedFont = {
  id: string;
  name: string;
  style: string;
  bucket: string;
  object_key: string;
  file_name: string;
  extension: string | null;
  size_bytes: number | bigint | null;
  created_at: Date;
  font_groups: {
    id: string;
    name: string;
  };
};

type SeededFontInput = {
  name: string;
  groupName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes?: number | bigint | null;
};

type FontGroupRef = {
  id: string;
  name: string;
};

const userStorageObjectSource: storage_object_source = 'USER';
const systemStorageObjectSource: storage_object_source = 'SYSTEM';

@Injectable()
export class FontsService {
  private readonly logger = new Logger(FontsService.name);
  private readonly allowedFontExtensions = new Set([
    '.ttf',
    '.otf',
    '.woff',
    '.woff2',
  ]);
  private readonly allowedFontMimeTypes = new Set([
    'font/ttf',
    'font/otf',
    'font/woff',
    'font/woff2',
    'application/font-sfnt',
    'application/x-font-ttf',
    'application/x-font-opentype',
    'application/octet-stream',
  ]);
  private readonly maxFontSizeBytes = 10 * 1024 * 1024;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  assertAuthenticatedRequest(authorization: string | undefined): void {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication is required');
    }
  }

  async uploadFonts(
    files: UploadedFontFile[],
    groupName: string,
  ): Promise<UploadFontsResponseDto> {
    try {
      const fontGroup = await this.findOrCreateFontGroup(groupName.trim());
      return this.uploadFontsToGroup(files, fontGroup);
    } catch (error) {
      this.rethrowKnownError(error);
      this.logger.error('Font upload failed.');
      throw new ServiceUnavailableException(
        'No se pudieron cargar las fuentes en este momento.',
      );
    }
  }

  async uploadFontsToBrandKit(
    brandKitId: string,
    files: UploadedFontFile[],
  ): Promise<UploadFontsResponseDto> {
    try {
      const fontGroup = await this.findBrandKitFontGroup(brandKitId);
      return this.uploadFontsToGroup(files, fontGroup);
    } catch (error) {
      this.rethrowKnownError(error);
      this.logger.error('Brand kit font upload failed.');
      throw new ServiceUnavailableException(
        'No se pudieron cargar las fuentes en este momento.',
      );
    }
  }

  async listFonts(groupName?: string): Promise<UploadFontsResponseDto> {
    try {
      const normalizedGroupName = groupName?.trim();
      const fonts = await this.prisma.fonts.findMany({
        where: {
          deleted_at: null,
          ...(normalizedGroupName
            ? {
                font_groups: {
                  name: normalizedGroupName,
                  deleted_at: null,
                },
              }
            : {}),
        },
        orderBy: [{ font_groups: { name: 'asc' } }, { name: 'asc' }],
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
          font_groups: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        fonts: await Promise.all(
          fonts.map((font) => this.toUploadedFontDto(font)),
        ),
      };
    } catch (error) {
      this.rethrowKnownError(error);
      this.logger.error('Font list failed.');
      throw new ServiceUnavailableException(
        'No se pudieron obtener las fuentes en este momento.',
      );
    }
  }

  async listFontsByBrandKitId(
    brandKitId: string,
  ): Promise<UploadFontsResponseDto> {
    const fontGroup = await this.findBrandKitFontGroup(brandKitId);
    return this.listFonts(fontGroup.name);
  }

  async updateFontForBrandKit(
    brandKitId: string,
    fontId: string,
    body: UploadedFontUpdateDto,
  ): Promise<UploadedFontDto> {
    const fontGroup = await this.findBrandKitFontGroup(brandKitId);
    const normalizedName = body.name.trim();
    const normalizedStyle = body.style.trim();

    if (!normalizedName || !normalizedStyle) {
      throw new BadRequestException(
        'Debe indicar un nombre y estilo de fuente validos.',
      );
    }

    await this.ensureFontExistsInGroup(fontId, fontGroup.id);

    try {
      return await this.updateFont(fontId, body);
    } catch (error) {
      this.rethrowKnownError(error);
      this.logger.error('Font update failed.');
      throw new ServiceUnavailableException(
        'No se pudo actualizar la fuente en este momento.',
      );
    }
  }

  async updateFont(
    fontId: string,
    body: UploadedFontUpdateDto,
  ): Promise<UploadedFontDto> {
    const normalizedName = body.name.trim();
    const normalizedStyle = body.style.trim();

    if (!normalizedName || !normalizedStyle) {
      throw new BadRequestException(
        'Debe indicar un nombre y estilo de fuente validos.',
      );
    }

    const existingFont = await this.prisma.fonts.findFirst({
      where: {
        id: fontId,
        deleted_at: null,
      },
      select: {
        id: true,
      },
    });

    if (!existingFont) {
      throw new NotFoundException(
        'No se encontro la fuente solicitada.',
      );
    }

    const font = await this.prisma.fonts.update({
      where: {
        id: fontId,
      },
      data: {
        name: normalizedName,
        style: normalizedStyle,
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
        font_groups: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.toUploadedFontDto(font);
  }

  async deleteFontForBrandKit(
    brandKitId: string,
    fontId: string,
  ): Promise<void> {
    const fontGroup = await this.findBrandKitFontGroup(brandKitId);
    await this.ensureFontExistsInGroup(fontId, fontGroup.id);
    await this.deleteFont(fontId);
  }

  async deleteFont(fontId: string): Promise<void> {
    const existingFont = await this.prisma.fonts.findFirst({
      where: {
        id: fontId,
        deleted_at: null,
      },
      select: {
        id: true,
      },
    });

    if (!existingFont) {
      throw new NotFoundException('No se encontro la fuente solicitada.');
    }

    try {
      await this.prisma.fonts.update({
        where: {
          id: fontId,
        },
        data: {
          deleted_at: new Date(),
        },
      });
    } catch (error) {
      this.rethrowKnownError(error);
      this.logger.error('Font deletion failed.');
      throw new ServiceUnavailableException(
        'No se pudo eliminar la fuente en este momento.',
      );
    }
  }

  async upsertSeededFont(input: SeededFontInput): Promise<UploadedFontDto> {
    const fontGroup = await this.findOrCreateFontGroup(input.groupName);
    const existingFont = await this.prisma.fonts.findFirst({
      where: {
        bucket: this.getFontBucketName(),
        object_key: input.storageKey,
      },
      select: {
        id: true,
      },
    });

    const fontData = {
      font_group_id: fontGroup.id,
      name: input.name,
      style: this.inferFontStyle(input.name),
      bucket: this.getFontBucketName(),
      object_key: input.storageKey,
      object_prefix: this.getObjectPrefix(input.storageKey),
      file_name: this.getFileName(input.storageKey),
      extension: this.getExtension(input.storageKey),
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes ?? null,
      source: systemStorageObjectSource,
    };

    const font = existingFont
      ? await this.prisma.fonts.update({
          where: {
            id: existingFont.id,
          },
          data: {
            ...fontData,
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
            font_groups: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      : await this.prisma.fonts.create({
          data: fontData,
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
            font_groups: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

    return this.toUploadedFontDto(font);
  }

  private async findOrCreateFontGroup(name: string): Promise<FontGroupRef> {
    return this.prisma.font_groups.upsert({
      where: {
        name,
      },
      update: {
        deleted_at: null,
      },
      create: {
        name,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  private async findBrandKitFontGroup(brandKitId: string): Promise<FontGroupRef> {
    const brandKit = await this.prisma.brand_kit.findFirst({
      where: {
        id: brandKitId,
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        font_group_id: true,
        font_groups: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!brandKit) {
      throw new NotFoundException('No se encontro el brand kit solicitado.');
    }

    if (brandKit.font_groups) {
      return brandKit.font_groups;
    }

    const fontGroup = await this.prisma.font_groups.create({
      data: {
        name: `brandkit-${brandKit.id}`,
      },
      select: {
        id: true,
        name: true,
      },
    });

    await this.prisma.brand_kit.update({
      where: {
        id: brandKit.id,
      },
      data: {
        font_group_id: fontGroup.id,
      },
    });

    return fontGroup;
  }

  private async ensureFontExistsInGroup(
    fontId: string,
    fontGroupId: string,
  ): Promise<void> {
    const existingFont = await this.prisma.fonts.findFirst({
      where: {
        id: fontId,
        font_group_id: fontGroupId,
        deleted_at: null,
      },
      select: {
        id: true,
      },
    });

    if (!existingFont) {
      throw new NotFoundException(
        'No se encontro la fuente asociada al brand kit solicitado.',
      );
    }
  }

  private validateFontFile(file: UploadedFontFile): void {
    const extension = extname(file.originalname).toLowerCase();

    if (!this.allowedFontExtensions.has(extension)) {
      throw new BadRequestException(
        'Solo se permiten fuentes TTF, OTF, WOFF o WOFF2.',
      );
    }

    if (!this.allowedFontMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(
        'Debe cargar una fuente con un tipo de archivo valido.',
      );
    }

    if (file.size > this.maxFontSizeBytes) {
      throw new BadRequestException(
        'Cada archivo debe pesar 10 MB o menos.',
      );
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('El archivo cargado esta vacio.');
    }
  }

  private async uploadFontsToGroup(
    files: UploadedFontFile[],
    fontGroup: FontGroupRef,
  ): Promise<UploadFontsResponseDto> {
    const fonts = await Promise.all(
      files.map(async (file) => {
        this.validateFontFile(file);
        const storageKey = this.createUserUploadStorageKey(
          fontGroup.name,
          file.originalname,
        );

        await this.storageService.uploadObject(
          this.getFontBucketName(),
          storageKey,
          file.buffer,
          file.mimetype,
        );

        const font = await this.prisma.fonts.create({
          data: {
            font_group_id: fontGroup.id,
            name: file.originalname,
            style: this.inferFontStyle(file.originalname),
            bucket: this.getFontBucketName(),
            object_key: storageKey,
            object_prefix: this.getObjectPrefix(storageKey),
            file_name: this.getFileName(storageKey),
            extension: this.getExtension(storageKey),
            mime_type: file.mimetype,
            size_bytes: file.size,
            source: userStorageObjectSource,
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
            font_groups: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        return this.toUploadedFontDto(font);
      }),
    );

    return { fonts };
  }

  private async toUploadedFontDto(
    font: PersistedFont,
  ): Promise<UploadedFontDto> {
    return {
      id: font.id,
      name: font.name,
      style: font.style,
      groupName: font.font_groups.name,
      url: await this.storageService.getSignedUrl(font.bucket, font.object_key),
      file_name: font.file_name,
      extension: font.extension,
      size_bytes:
        typeof font.size_bytes === 'bigint'
          ? Number(font.size_bytes)
          : font.size_bytes,
      created_at: font.created_at,
    };
  }

  private getFontBucketName(): string {
    return this.storageService.getFontsBucket();
  }

  private createUserUploadStorageKey(
    groupName: string,
    fileName: string,
  ): string {
    const safeExtension = extname(fileName).toLowerCase();
    const normalizedBaseName = this.normalizePathSegment(
      basename(fileName, safeExtension),
    );
    const normalizedGroupName = this.normalizePathSegment(groupName);
    return `fonts/uploads/${normalizedGroupName}/${normalizedBaseName}-${randomUUID()}${safeExtension}`;
  }

  private inferFontStyle(fileName: string): string {
    const baseName = basename(fileName, extname(fileName));
    const styleToken = baseName.split('-').pop()?.trim();
    return styleToken || 'Regular';
  }

  private normalizePathSegment(value: string): string {
    return (
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'font'
    );
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

  private rethrowKnownError(error: unknown): void {
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException ||
      error instanceof UnauthorizedException
    ) {
      throw error;
    }
  }
}
