import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { area_name } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/client';
import { BlockRegistry } from '../blocks/block.registry';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTemplateBody, UpdateTemplateBody } from './templates.schemas';
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

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TemplateListItem = {
  id: string;
  name: string;
  description: string | null;
  area: area_name;
  layout: JsonValue | null;
  orientation: string | null;
  stateName: string;
  state: string;
  promptBase: string | null;
  createdAt: string;
  requiredGenerationFields: TemplateGenerationField[];
  optionalGenerationFields: TemplateGenerationField[];
};

type TemplateRecord = {
  id: string;
  name: string;
  description: string | null;
  layout: JsonValue | null;
  orientation: string | null;
  prompt_base: string | null;
  created_at: Date;
  areas: {
    name: area_name;
  } | null;
  template_states: {
    code: string;
    name: string;
  };
};

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);
  private readonly blockRegistry = BlockRegistry.getInstance();

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

  private serializeTemplate(template: TemplateRecord): TemplateListItem | null {
    if (!template.areas) {
      return null;
    }

    const promptConfig = this.parsePromptConfig(template.prompt_base);

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      area: template.areas.name,
      layout: template.layout,
      orientation: template.orientation ?? null,
      stateName: template.template_states.name,
      state: template.template_states.code,
      promptBase: promptConfig.promptText ?? template.prompt_base,
      createdAt: template.created_at.toISOString(),
      requiredGenerationFields: promptConfig.requiredGenerationFields,
      optionalGenerationFields: promptConfig.optionalGenerationFields,
    };
  }

  async getAll(): Promise<TemplateListItem[]> {
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
      const serialized = this.serializeTemplate(template);
      return serialized ? [serialized] : [];
    });
  }

  async getById(id: string): Promise<TemplateListItem> {
    const template = await this.prisma.templates.findFirst({
      where: {
        id,
        deleted_at: null,
      },
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

    if (!template) {
      throw new NotFoundException('Template no encontrado');
    }

    const serialized = this.serializeTemplate(template);

    if (!serialized) {
      throw new NotFoundException('Template no encontrado');
    }

    return serialized;
  }

  async create(template: CreateTemplateBody, userId: string) {
    const validatedLayout = template.layout.map((block) =>
      validateTemplateBlocks(block, this.blockRegistry),
    );

    const [area, state, creator] = await Promise.all([
      this.prisma.areas.findUnique({
        where: { name: template.area },
      }),
      this.prisma.template_states.findUnique({
        where: { code: template.state },
      }),
      uuidPattern.test(userId)
        ? this.prisma.users.findUnique({
            where: { id: userId },
            select: { id: true },
          })
        : Promise.resolve(null),
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

    if (!creator) {
      this.logger.warn(
        'Template creator user was not found; saving template without creator reference.',
      );
    }

    const newTemplate = await this.prisma.templates.create({
      data: {
        name: template.name,
        description: template.description,
        area_id: area.id,
        layout: validatedLayout,
        state_id: state.id,
        prompt_base: template.promptBase,
        created_by_user_id: creator?.id ?? null,
        orientation: template.orientation,
      },
    });

    return {
      payload: newTemplate,
    };
  }

  async update(id: string, body: UpdateTemplateBody) {
    const existingTemplate = await this.prisma.templates.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: {
        id: true,
      },
    });

    if (!existingTemplate) {
      throw new NotFoundException('Template no encontrado');
    }

    const [area, state] = await Promise.all([
      body.area
        ? this.prisma.areas.findUnique({
            where: { name: body.area },
          })
        : Promise.resolve(null),
      body.state
        ? this.prisma.template_states.findUnique({
            where: { code: body.state },
          })
        : Promise.resolve(null),
    ]);

    if (body.area && !area) {
      throw new BadRequestException({
        message: `Área no encontrada: ${body.area}`,
      });
    }

    if (body.state && !state) {
      throw new BadRequestException({
        message: `Estado no encontrado: ${body.state}`,
      });
    }

    const validatedLayout = body.layout?.map((block) =>
      validateTemplateBlocks(block, this.blockRegistry),
    );

    const updatedTemplate = await this.prisma.templates.update({
      where: { id: existingTemplate.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
        ...(body.promptBase !== undefined
          ? { prompt_base: body.promptBase }
          : {}),
        ...(body.orientation !== undefined
          ? { orientation: body.orientation }
          : {}),
        ...(area ? { area_id: area.id } : {}),
        ...(state ? { state_id: state.id } : {}),
        ...(validatedLayout ? { layout: validatedLayout } : {}),
      },
    });

    return {
      payload: updatedTemplate,
    };
  }

  async delete(id: string) {
    const template = await this.prisma.templates.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: {
        id: true,
      },
    });

    if (!template) {
      throw new NotFoundException('Template no encontrado');
    }

    return this.prisma.templates.update({
      where: { id: template.id },
      data: {
        deleted_at: new Date(),
      },
    });
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
