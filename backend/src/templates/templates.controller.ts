import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import {
  idAndAssetIdParamSchema,
  idParamSchema,
} from '../common/zod/route-params.schema';
import type {
  IdAndAssetIdParam,
  IdParam,
} from '../common/zod/route-params.schema';
import { ZodValidationPipe } from '../common/zod/zod-validation.pipe';
import {
  addTemplateAssetBodySchema,
  createTemplateBodySchema,
  defineTemplateBlocksBodySchema,
  updateTemplateAssetBodySchema,
  updateTemplateBodySchema,
  updateTemplateStatusBodySchema,
} from './templates.schemas';
import type {
  AddTemplateAssetBody,
  CreateTemplateBody,
  DefineTemplateBlocksBody,
  UpdateTemplateAssetBody,
  UpdateTemplateBody,
  UpdateTemplateStatusBody,
} from './templates.schemas';
import { RequirePermission } from '../modules/auth/decorators/permissions.decorator';
import { MockAuthGuard } from '../modules/auth/guards/mockup.guard';
import { PermissionsGuard } from '../modules/auth/guards/permissions.guard';
import { Action } from '../modules/auth/enum/actions';
import { Resource } from '../modules/auth/enum/resources';
import { GetUser } from '../modules/auth/decorators/user.decorator';

@Controller(Resource.TEMPLATES)
@UseGuards(MockAuthGuard, PermissionsGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) { }

  @Get()
  async getAll() {
    return this.templatesService.getAll();
  }

  @Post()
  @RequirePermission(Action.TEMPLATE_CREATE_RETIRE, Resource.TEMPLATES)
  async create(
    @Body(new ZodValidationPipe(createTemplateBodySchema)) body: CreateTemplateBody,
    @GetUser() user: { id: string },
  ) {
    try {
      const newTemplate = await this.templatesService.create(body, user.id);

      return {
        message: 'Template creado exitosamente',
        newTemplate,
        status: 201
      }

    } catch (error) {
      throw new BadRequestException({
        message: 'No se pudo crear el template en este momento.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        status: 400
      });
    }
  }

  @Get(':id')
  async getById(@Param(new ZodValidationPipe(idParamSchema)) params: IdParam) {
    try {
      const template = await this.templatesService.getById(params.id);

      if (!template) {
        throw new BadRequestException({
          message: `Template no encontrado con ID: ${params.id}`,
          status: 404
        });
      }

      return {
        payload: template,
        status: 200
      };

    } catch (error) {
      throw new BadRequestException({
        message: 'No se pudo obtener el template en este momento.',
        error: error instanceof Error ? error.message : 'Error desconocido',
        status: 400
      });
    }
  }

  @RequirePermission(Action.TEMPLATE_EDIT, Resource.TEMPLATES)
  @Patch(':id')
  update(
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
    @Body(new ZodValidationPipe(updateTemplateBodySchema))
    body: UpdateTemplateBody,
  ) {
    void body;
    return this.templatesService.update(params.id);
  }

  @Delete(':id')
  async delete(@Param(new ZodValidationPipe(idParamSchema)) params: IdParam) {
    return this.templatesService.delete(params.id);
  }

  @Post(':id/status')
  updateStatus(
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
    @Body(new ZodValidationPipe(updateTemplateStatusBodySchema))
    body: UpdateTemplateStatusBody,
  ) {
    void body;
    return this.templatesService.updateStatus(params.id);
  }

  @Post(':id/blocks')
  defineBlocks(
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
    @Body(new ZodValidationPipe(defineTemplateBlocksBodySchema))
    body: DefineTemplateBlocksBody,
  ) {
    void body;
    return this.templatesService.defineBlocks(params.id);
  }

  @Get(':id/assets')
  getAssets(@Param(new ZodValidationPipe(idParamSchema)) params: IdParam) {
    return this.templatesService.getAssets(params.id);
  }

  @Post(':id/assets')
  addAsset(
    @Param(new ZodValidationPipe(idParamSchema)) params: IdParam,
    @Body(new ZodValidationPipe(addTemplateAssetBodySchema))
    body: AddTemplateAssetBody,
  ) {
    void body;
    return this.templatesService.addAsset(params.id);
  }

  @Patch(':id/assets/:assetId')
  updateAsset(
    @Param(new ZodValidationPipe(idAndAssetIdParamSchema))
    params: IdAndAssetIdParam,
    @Body(new ZodValidationPipe(updateTemplateAssetBodySchema))
    body: UpdateTemplateAssetBody,
  ) {
    void body;
    return this.templatesService.updateAsset(params.id, params.assetId);
  }
}
