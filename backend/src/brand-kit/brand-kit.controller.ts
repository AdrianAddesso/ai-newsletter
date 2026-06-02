import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
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
import { BrandKitService } from './brand-kit.service';
import {
  brandKitIdParamSchema,
  idParamSchema,
} from '../common/zod/route-params.schema';
import type {
  BrandKitIdParam,
  IdParam,
} from '../common/zod/route-params.schema';
import { ZodValidationPipe } from '../common/zod/zod-validation.pipe';
import {
  createBrandKitBodySchema,
  createBrandKitColorBodySchema,
  updateBrandKitBodySchema,
  updateBrandKitColorBodySchema,
} from './brand-kit.schemas';
import type {
  CreateBrandKitBody,
  CreateBrandKitColorBody,
  UpdateBrandKitBody,
  UpdateBrandKitColorBody,
} from './brand-kit.schemas';
import { RequirePermission } from '../modules/auth/decorators/permissions.decorator';
import { Action } from '../modules/auth/enum/actions';
import { MockAuthGuard } from '../modules/auth/guards/mockup.guard';
import { PermissionsGuard } from '../modules/auth/guards/permissions.guard';
import { Resource } from '../modules/auth/enum/resources';
import { FontsService } from '../fonts/fonts.service';
import type {
  UploadedFontFile,
  UploadedFontUpdateDto,
  UploadFontsResponseDto,
} from '../fonts/dto/upload-font.dto';
import type {
  BrandKitDetail,
  BrandKitListItem,
  BrandKitResourceColor,
  BrandKitResources,
} from './brand-kit.service';

const maxUploadFiles = 5;

@Controller('brand-kit')
@UseGuards(MockAuthGuard, PermissionsGuard)
export class BrandKitController {
  constructor(
    private readonly brandKitService: BrandKitService,
    private readonly fontsService: FontsService,
  ) {}

  @Get()
  getAll(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<BrandKitListItem[]> {
    return this.brandKitService.getAll(includeInactive === 'true');
  }

  @Get(':id')
  getById(
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
  ): Promise<BrandKitDetail> {
    return this.brandKitService.getById(params.id);
  }

  @Get(':brandKitId/resources')
  getResources(
    @Param(new ZodValidationPipe(brandKitIdParamSchema))
    params: BrandKitIdParam,
  ): Promise<BrandKitResources> {
    return this.brandKitService.getResources(params.brandKitId);
  }

  @Get(':brandKitId/fonts')
  listFonts(
    @Headers('authorization') authorization: string | undefined,
    @Param(new ZodValidationPipe(brandKitIdParamSchema))
    params: BrandKitIdParam,
  ): Promise<UploadFontsResponseDto> {
    this.fontsService.assertAuthenticatedRequest(authorization);
    return this.fontsService.listFontsByBrandKitId(params.brandKitId);
  }

  @Post()
  @RequirePermission(Action.BRAND_MANAGE, Resource.BRAND_KIT)
  create(
    @Body(new ZodValidationPipe(createBrandKitBodySchema))
    body: CreateBrandKitBody,
  ): Promise<BrandKitDetail> {
    return this.brandKitService.create(body);
  }

  @Post(':brandKitId/colors')
  @RequirePermission(Action.BRAND_MANAGE, Resource.BRAND_KIT)
  createColor(
    @Param(new ZodValidationPipe(brandKitIdParamSchema))
    params: BrandKitIdParam,
    @Body(new ZodValidationPipe(createBrandKitColorBodySchema))
    body: CreateBrandKitColorBody,
  ): Promise<BrandKitResourceColor> {
    return this.brandKitService.createColor(params.brandKitId, body);
  }

  @Post(':brandKitId/fonts')
  @RequirePermission(Action.BRAND_MANAGE, Resource.BRAND_KIT)
  @UseInterceptors(FilesInterceptor('files', maxUploadFiles))
  uploadFonts(
    @Headers('authorization') authorization: string | undefined,
    @Param(new ZodValidationPipe(brandKitIdParamSchema))
    params: BrandKitIdParam,
    @UploadedFiles() files: UploadedFontFile[] | undefined,
  ): Promise<UploadFontsResponseDto> {
    this.fontsService.assertAuthenticatedRequest(authorization);

    if (!files?.length) {
      throw new BadRequestException('Debe cargar al menos un archivo.');
    }

    return this.fontsService.uploadFontsToBrandKit(params.brandKitId, files);
  }

  @Patch(':id')
  @RequirePermission(Action.BRAND_MANAGE, Resource.BRAND_KIT)
  update(
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
    @Body(new ZodValidationPipe(updateBrandKitBodySchema))
    body: UpdateBrandKitBody,
  ): Promise<BrandKitDetail> {
    return this.brandKitService.update(params.id, body);
  }

  @Patch(':brandKitId/colors/:colorId')
  @RequirePermission(Action.BRAND_MANAGE, Resource.BRAND_KIT)
  updateColor(
    @Param('brandKitId') brandKitId: string,
    @Param('colorId') colorId: string,
    @Body(new ZodValidationPipe(updateBrandKitColorBodySchema))
    body: UpdateBrandKitColorBody,
  ): Promise<BrandKitResourceColor> {
    return this.brandKitService.updateColor(brandKitId, colorId, body);
  }

  @Patch(':brandKitId/fonts/:fontId')
  @RequirePermission(Action.BRAND_MANAGE, Resource.BRAND_KIT)
  updateFont(
    @Headers('authorization') authorization: string | undefined,
    @Param('brandKitId') brandKitId: string,
    @Param('fontId') fontId: string,
    @Body() body: UploadedFontUpdateDto,
  ) {
    this.fontsService.assertAuthenticatedRequest(authorization);
    return this.fontsService.updateFontForBrandKit(brandKitId, fontId, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission(Action.BRAND_MANAGE, Resource.BRAND_KIT)
  async delete(
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
  ): Promise<void> {
    await this.brandKitService.delete(params.id);
  }

  @Delete(':brandKitId/colors/:colorId')
  @HttpCode(204)
  @RequirePermission(Action.BRAND_MANAGE, Resource.BRAND_KIT)
  async deleteColor(
    @Param('brandKitId') brandKitId: string,
    @Param('colorId') colorId: string,
  ): Promise<void> {
    await this.brandKitService.deleteColor(brandKitId, colorId);
  }

  @Delete(':brandKitId/fonts/:fontId')
  @HttpCode(204)
  @RequirePermission(Action.BRAND_MANAGE, Resource.BRAND_KIT)
  async deleteFont(
    @Headers('authorization') authorization: string | undefined,
    @Param('brandKitId') brandKitId: string,
    @Param('fontId') fontId: string,
  ): Promise<void> {
    this.fontsService.assertAuthenticatedRequest(authorization);
    await this.fontsService.deleteFontForBrandKit(brandKitId, fontId);
  }
}
