import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { area_name } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JsonValue } from '@prisma/client/runtime/client';
import { CreateTemplateBody } from './templates.schemas';
import { BlockRegistry } from '../blocks/block.registry';
import { validateTemplateBlocks } from './validations/validations';

const validGenerationFields = [
  'relevantDates',
  'cta',
  'contact',
  'linksOrSources',
  'additionalContext',
] as const;

type TemplateGenerationField = (typeof validGenerationFields)[number];

type TemplatePromptConfig = {
  promptText: string | null;
  requiredGenerationFields: TemplateGenerationField[];
  optionalGenerationFields: TemplateGenerationField[];
};

export type TemplateListItem = {
  id: string;
  name: string;
  description: string | null;
  area: area_name;
  layout: JsonValue | null;
  orientation: string | null;
  state: string;
  prompt_base: string | null;
  createdAt: string;
  requiredGenerationFields: TemplateGenerationField[];
  optionalGenerationFields: TemplateGenerationField[];
};

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);
  private readonly blockRegistry = BlockRegistry.getInstance();

  constructor(private readonly prisma: PrismaService) { }

  private isTemplateGenerationField(
    value: unknown,
  ): value is TemplateGenerationField {
    return (
      typeof value === 'string' &&
      validGenerationFields.includes(value as TemplateGenerationField)
    );
  }

  private parsePromptConfig(promptBase: string | null): TemplatePromptConfig {
    if (!promptBase) {
      return {
        promptText: null,
        requiredGenerationFields: [],
        optionalGenerationFields: [],
      };
    }

    try {
      const parsed = JSON.parse(promptBase) as {
        promptText?: unknown;
        requiredGenerationFields?: unknown;
        optionalGenerationFields?: unknown;
      };

      const requiredGenerationFields = Array.isArray(
        parsed.requiredGenerationFields,
      )
        ? parsed.requiredGenerationFields.filter((field) =>
          this.isTemplateGenerationField(field),
        )
        : [];

      const optionalGenerationFields = Array.isArray(
        parsed.optionalGenerationFields,
      )
        ? parsed.optionalGenerationFields.filter((field) =>
          this.isTemplateGenerationField(field),
        )
        : [];

      return {
        promptText:
          typeof parsed.promptText === 'string' ? parsed.promptText : null,
        requiredGenerationFields,
        optionalGenerationFields,
      };
    } catch {
      this.logger.warn('Template prompt config is not valid JSON.');
      return {
        promptText: promptBase,
        requiredGenerationFields: [],
        optionalGenerationFields: [],
      };
    }
  }

  // modificar aca para que devuelva los campos necesarios para el listado de templates
  async getAll(): Promise<TemplateListItem[]> {
    try {
      const templates = await this.prisma.templates.findMany({
        where: {
          deleted_at: null,
          area_id: {
            not: null,
          },
        },
        orderBy: [{ created_at: 'asc' }],
        select: {
          id: true,
          name: true,
          description: true,
          layout: true,
          orientation: true,
          prompt_base: true,
          created_at: true,
          areas: {
            select: {
              name: true,
            },
          },
          template_states: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      });

      return templates.flatMap((template) => {
        if (!template.areas) {
          return [];
        }

        const promptConfig = this.parsePromptConfig(template.prompt_base);

        return [
          {
            id: template.id,
            name: template.name,
            description: template.description,
            area: template.areas.name,
            layout: template.layout,
            orientation: template.orientation ?? null,
            state: template.template_states.code,
            prompt_base: template.prompt_base,
            createdAt: template.created_at.toISOString(),
            requiredGenerationFields: promptConfig.requiredGenerationFields,
            optionalGenerationFields: promptConfig.optionalGenerationFields,
          },
        ];
      });
    } catch {
      this.logger.error('Template list failed.');
      throw new ServiceUnavailableException(
        'No se pudieron obtener las plantillas en este momento.',
      );
    }
  }

  async getById(id: string) {
    return this.prisma.templates.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      include: {
        areas: {
          select: {
            name: true,
          },
        },
        template_states: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    })
  }

  async create(template: CreateTemplateBody, userId: string) {

    const validateBlocks = template.layout.map(block => validateTemplateBlocks(block, this.blockRegistry));

    const [area, state] = await Promise.all([
      this.prisma.areas.findUnique({
        where: { name: template.area },
      }),
      this.prisma.template_states.findUnique({
        where: { code: template.state },
      }),
    ]);

    if (!area) {
      throw new BadRequestException({
        message: `Área no encontrada: ${template.area}`,
       });
    }

    if (!state) {
      throw new BadRequestException({
        message: `Estado no encontrado: ${template.state}`,
      }); 
    }

    try {
      const newTemplate = await this.prisma.templates.create({
        data: {
          name: template.name, description: template.description, area_id: area.id, layout: validateBlocks,
          state_id: state.id, prompt_base: template.promptBase, created_by_user_id: userId, orientation: template.orientation
        },
      });

      return {
        payload: newTemplate
      }

    } catch (error) {
      this.logger.error('Error creando el template', error);
      throw new BadRequestException('No se pudo crear el template en este momento.')
    }
  }

  update(id: string) {
    return 'Desde update templates con ID' + id
  }

  async delete(id: string) {
    return this.prisma.templates.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    })
  }

  updateStatus(id: string) {
    return 'Desde update status templates con ID' + id
  }

  defineBlocks(id: string) {
    return 'Desde define blocks templates con ID' + id
  }

  getAssets(templateId: string) {
    return `Desde assets templates con ID ${templateId}`
  }

  addAsset(templateId: string) {
    return `Desde add asset templates con ID ${templateId}`
  }

  updateAsset(templateId: string, assetId: string) {
    return `Desde update asset templates con ID ${templateId} y asset ID ${assetId}`
  }
}