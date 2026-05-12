import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { area_name } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
  layout: string | null;
  stateCode: string;
  stateName: string;
  createdAt: string;
  requiredGenerationFields: TemplateGenerationField[];
  optionalGenerationFields: TemplateGenerationField[];
};

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

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
            stateCode: template.template_states.code,
            stateName: template.template_states.name,
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

  getById(id: string) {
    return 'Desde templates con ID' + id;
  }

  create() {
    return 'Desde templates';
  }

  update(id: string) {
    return 'Desde update templates con ID' + id;
  }

  delete(id: string) {
    return 'Desde delete templates con ID' + id;
  }

  updateStatus(id: string) {
    return 'Desde update status templates con ID' + id;
  }

  defineBlocks(id: string) {
    return 'Desde define blocks templates con ID' + id;
  }

  getAssets(templateId: string) {
    return `Desde assets templates con ID ${templateId}`;
  }

  addAsset(templateId: string) {
    return `Desde add asset templates con ID ${templateId}`;
  }

  updateAsset(templateId: string, assetId: string) {
    return `Desde update asset templates con ID ${templateId} y asset ID ${assetId}`;
  }
}
