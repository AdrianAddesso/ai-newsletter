import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { asset_type } from '@prisma/client';
import { RequirePermission } from '../modules/auth/decorators/permissions.decorator';
import { Action } from '../modules/auth/enum/actions';
import { Resource } from '../modules/auth/enum/resources';
import { MockAuthGuard } from '../modules/auth/guards/mockup.guard';
import { PermissionsGuard } from '../modules/auth/guards/permissions.guard';
import { AssetsService } from './assets.service';
import type {
  UploadedAssetDto,
  UploadedAssetFile,
  UploadAssetsResponseDto,
  UpdateAssetDto,
} from './dto/upload-asset.dto';

const maxUploadFiles = 5;
const maxAssetFileSizeBytes = 5 * 1024 * 1024;
const allowedAssetMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

@Controller(Resource.ASSETS)
@UseGuards(MockAuthGuard, PermissionsGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @RequirePermission(Action.CONTENT_GENERATE_AI, Resource.ASSETS)
  listAssets(
    @Query('type') type?: string,
    @Query('brandKitId') brandKitId?: string,
  ): Promise<UploadAssetsResponseDto> {
    if (type && !this.isAssetType(type)) {
      throw new BadRequestException('Debe indicar un tipo de asset valido.');
    }

    return this.assetsService.listAssets(
      type as asset_type | undefined,
      brandKitId,
    );
  }

  @Get('block-previews/:previewKey')
  @RequirePermission(Action.TEMPLATE_VIEW_COPY, Resource.TEMPLATES)
  getBlockPreviewAsset(
    @Param('previewKey') previewKey: string,
  ): Promise<UploadedAssetDto> {
    return this.assetsService.getBlockPreviewAsset(previewKey);
  }

  @Get('seeded')
  @RequirePermission(Action.TEMPLATE_VIEW_COPY, Resource.TEMPLATES)
  getSeededAsset(
    @Query('storageKey') storageKey: string | undefined,
    @Query('type') type: string | undefined,
  ): Promise<UploadedAssetDto> {
    if (!storageKey) {
      throw new BadRequestException('Debe indicar un asset valido.');
    }

    if (!this.isAssetType(type)) {
      throw new BadRequestException('Debe indicar un tipo de asset valido.');
    }

    return this.assetsService.getSeededAsset(storageKey, type);
  }

  @Post()
  @RequirePermission(Action.CONTENT_UPLOAD, Resource.ASSETS)
  @UseInterceptors(
    FilesInterceptor('files', maxUploadFiles, {
      limits: {
        fileSize: maxAssetFileSizeBytes,
      },
      fileFilter: (_request, file, callback) => {
        if (!allowedAssetMimeTypes.has(file.mimetype)) {
          callback(
            new BadRequestException(
              'Solo se permiten imagenes JPG, PNG, WebP, GIF o SVG.',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadAssets(
    @Body('type') type: string | undefined,
    @Body('name') name: string | undefined,
    @Body('description') description: string | undefined,
    @Body('brandKitId') brandKitId: string | undefined,
    @UploadedFiles() files: UploadedAssetFile[] | undefined,
  ): Promise<UploadAssetsResponseDto> {
    if (!files?.length) {
      throw new BadRequestException('Debe cargar al menos un archivo.');
    }

    if (!this.isAssetType(type)) {
      throw new BadRequestException('Debe indicar un tipo de asset valido.');
    }

    return this.assetsService.uploadAssets(files, type, {
      name,
      description,
      brandKitId,
    });
  }

  @Patch(':id')
  @RequirePermission(Action.CONTENT_UPLOAD, Resource.ASSETS)
  updateAsset(
    @Param('id') id: string,
    @Body() body: Partial<UpdateAssetDto>,
  ): Promise<UploadedAssetDto> {
    if (!body.name?.trim()) {
      throw new BadRequestException('Debe indicar un nombre de asset valido.');
    }

    if (!this.isEditableAssetType(body.type)) {
      throw new BadRequestException('Debe indicar un tipo de asset valido.');
    }

    return this.assetsService.updateAsset(id, {
      name: body.name,
      description: body.description,
      type: body.type,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission(Action.CONTENT_UPLOAD, Resource.ASSETS)
  async deleteAsset(
    @Param('id') id: string,
    @Query('brandKitId') brandKitId?: string,
  ): Promise<void> {
    await this.assetsService.deleteAsset(id, brandKitId);
  }

  private isAssetType(value: string | undefined): value is asset_type {
    return !!value && Object.values(asset_type).includes(value as asset_type);
  }

  private isEditableAssetType(
    value: asset_type | undefined,
  ): value is Exclude<asset_type, 'BLOCK'> {
    return this.isAssetType(value) && value !== asset_type.BLOCK;
  }
}
