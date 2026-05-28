import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ai_config_type } from '@prisma/client';
import type { BlockEditField } from '@shared/types/block.types';
import { z } from 'zod';
import { buildNewsletterBlocksFromLayout, parseBlockValues } from '../blocks/newsletter-blocks';
import { PrismaService } from '../prisma/prisma.service';
import { GenerationConfig, NestleGeniaGenerateContentSuccess } from './ai.types';
import { AiConfigResponseDto, UpdateAiConfigDto } from './dto/ai-config.dto';
import {
  GenerateNewsletterRequestDto,
  GenerateNewsletterResponseDto,
} from './dto/generate-newsletter.dto';
import { ImproveTextRequestDto, ImproveTextResponseDto } from './dto/improve-text.dto';
import {
  CreatePromptCommandDto,
  PromptCommandResponseDto,
  UpdatePromptCommandDto,
} from './dto/prompt-commands.dto';

type PromptBrandKit = {
  name: string;
  assets: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  colors: Array<{
    id: string;
    name: string;
    hex: string;
  }>;
  fonts: Array<{
    id: string;
    name: string;
    style: string;
    groupName: string;
  }>;
};

type GeneratedBlockValues = Record<string, string | null | undefined>;
type PromptCommandRow = {
  id: string;
  name: string;
  type: ai_config_type;
  display_order: number;
  instruction: string | null;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private readonly textImprovementPublicErrorMessage =
    'No se pudo mejorar el texto en este momento.';
  private readonly newsletterGenerationPublicErrorMessage =
    'No se pudo generar el newsletter en este momento.';
  private readonly defaultNestleGeniaUrl =
    'https://eur-sdr-int-pub.nestle.com/api/dv-exp-sandbox-openai-api/1/genai/GCP/gemini-2.0-flash-001/generateContent';

  private readonly fallbackGenerationConfig: Record<ai_config_type, GenerationConfig> = {
    [ai_config_type.REGENERATE]: {
      temperature: 0.1,
      topP: 0.8,
      topK: 20,
      maxOutputTokens: 4000,
    },
    [ai_config_type.CREATE]: {
      temperature: 0.5,
      topP: 0.8,
      topK: 20,
      maxOutputTokens: 4000,
    },
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async improveText(
    request: ImproveTextRequestDto,
  ): Promise<ImproveTextResponseDto> {
    const originalText = request.text?.trim();

    if (!originalText) {
      throw new BadRequestException(
        'El texto es requerido y no puede estar vacío',
      );
    }

    if (originalText.length > 3000) {
      throw new BadRequestException(
        'El texto debe tener 3000 caracteres o menos',
      );
    }

    return this.improveTextWithAi(originalText);
  }

  async generateNewsletter(
    request: GenerateNewsletterRequestDto,
  ): Promise<GenerateNewsletterResponseDto> {
    const template = await this.prisma.templates.findFirst({
      where: {
        id: request.templateId,
        deleted_at: null,
      },
      select: {
        id: true,
        layout: true,
      },
    });

    if (!template) {
      throw new NotFoundException('No se encontro el template solicitado.');
    }

    const brandKit = await this.prisma.brand_kit.findFirst({
      where: {
        id: request.brandKitId,
        deleted_at: null,
        active: true,
      },
      select: {
        id: true,
        name: true,
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
              },
            },
          },
        },
      },
    });

    if (!brandKit) {
      throw new NotFoundException('No se encontro el brand kit solicitado.');
    }

    const templateBlocks = buildNewsletterBlocksFromLayout(template.layout);
    const prompt = await this.buildNewsletterGenerationPrompt(
      request,
      templateBlocks,
      {
        name: brandKit.name,
        assets: brandKit.brandkit_assets.map(({ assets }) => ({
          id: assets.id,
          name: assets.name,
          type: assets.type,
        })),
        colors: brandKit.color_palette.map(({ colors }) => ({
          id: colors.id,
          name: colors.name,
          hex: colors.hex,
        })),
        fonts: (brandKit.font_groups?.fonts ?? []).map((font) => ({
          id: font.id,
          name: font.name,
          style: font.style,
          groupName: brandKit.font_groups?.name ?? '',
        })),
      },
    );

    let generatedValues: Map<string, GeneratedBlockValues>;

    try {
      const generatedText = await this.generateNewsletterWithAi(prompt);
      generatedValues = this.parseGeneratedNewsletterBlocks(
        generatedText,
        templateBlocks,
      );
    } catch (error) {
      if (!this.shouldFallbackToUserContent(error)) {
        throw error;
      }

      this.logger.warn(
        `AI generateNewsletter fallback activated for template=${request.templateId} brandKit=${request.brandKitId}`,
      );
      generatedValues = this.buildUserContentFallbackValues(
        request,
        templateBlocks,
        (brandKit.font_groups?.fonts ?? []).map((font) => font.name),
      );
    }

    return {
      blocks: buildNewsletterBlocksFromLayout(template.layout, generatedValues),
    };
  }

  async getAiConfigs(): Promise<AiConfigResponseDto[]> {
    const rows = await this.prisma.ai_config.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'asc' },
    });

    return rows.map((row) => this.mapAiConfigToDto(row));
  }

  async updateAiConfig(
    id: string,
    dto: UpdateAiConfigDto,
  ): Promise<AiConfigResponseDto> {
    const existing = await this.prisma.ai_config.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Configuracion de IA no encontrada.');
    }

    const updated = await this.prisma.ai_config.update({
      where: { id },
      data: { ...dto, updated_at: new Date() },
    });

    return this.mapAiConfigToDto(updated);
  }

  async getPromptCommands(
    type?: ai_config_type,
  ): Promise<PromptCommandResponseDto[]> {
    const rows = await this.prisma.prompt_commands.findMany({
      where: { deleted_at: null, ...(type ? { type } : {}) },
      orderBy: [{ type: 'asc' }, { display_order: 'asc' }],
    });

    return rows.map((row) => this.mapPromptCommandToDto(row));
  }

  async createPromptCommand(
    dto: CreatePromptCommandDto,
  ): Promise<PromptCommandResponseDto> {
    const row = await this.prisma.prompt_commands.create({ data: dto });
    return this.mapPromptCommandToDto(row);
  }

  async updatePromptCommand(
    id: string,
    dto: UpdatePromptCommandDto,
  ): Promise<PromptCommandResponseDto> {
    const existing = await this.prisma.prompt_commands.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Instruccion de prompt no encontrada.');
    }

    const updated = await this.prisma.prompt_commands.update({
      where: { id },
      data: { ...dto, updated_at: new Date() },
    });

    return this.mapPromptCommandToDto(updated);
  }

  async deletePromptCommand(id: string): Promise<void> {
    const existing = await this.prisma.prompt_commands.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Instruccion de prompt no encontrada.');
    }

    await this.prisma.prompt_commands.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  private readEnv(key: string): string | null {
    const value = this.configService.get<string>(key)?.trim();
    return value ? value : null;
  }

  private async improveTextWithAi(
    originalText: string,
  ): Promise<ImproveTextResponseDto> {
    const [promptCommands, genConfig] = await Promise.all([
      this.fetchPromptCommands(ai_config_type.REGENERATE),
      this.fetchGenerationConfig(ai_config_type.REGENERATE),
    ]);
    const promptLines = promptCommands
      .map((command) => command.instruction?.trim() ?? '')
      .filter(Boolean);

    this.logger.log(
      `AI improveText using ${promptLines.length} prompt_commands and ai_config type=${ai_config_type.REGENERATE} inputLength=${originalText.length}`,
    );

    const responseBody = await this.callAiProvider(
      this.buildTextImprovementPayload(
        originalText,
        promptLines.join('\n'),
        genConfig,
      ),
      this.textImprovementPublicErrorMessage,
      'improveText',
    );

    return {
      originalText,
      improvedText: this.extractNestleText(
        responseBody,
        this.extractNestleModelName(),
        this.textImprovementPublicErrorMessage,
        'improveText',
      ),
    };
  }

  private async generateNewsletterWithAi(prompt: string): Promise<string> {
    const genConfig = await this.fetchGenerationConfig(ai_config_type.CREATE);
    this.logger.log(
      `AI generateNewsletter using ai_config type=${ai_config_type.CREATE} promptLength=${prompt.length}`,
    );
    const payload = this.buildNewsletterGenerateContentPayload(prompt, genConfig);

    const responseBody = await this.callAiProvider(
      payload,
      this.newsletterGenerationPublicErrorMessage,
      'generateNewsletter',
    );

    return this.extractNestleText(
      responseBody,
      this.extractNestleModelName(),
      this.newsletterGenerationPublicErrorMessage,
      'generateNewsletter',
    );
  }

  private async fetchGenerationConfig(
    type: ai_config_type,
  ): Promise<GenerationConfig> {
    const config = await this.prisma.ai_config.findFirst({
      where: { type, deleted_at: null },
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        temperature: true,
        top_p: true,
        top_k: true,
        max_output_tokens: true,
      },
    });

    if (!config) {
      this.logger.warn(
        `No ai_config found for type=${type}. Using hardcoded fallback.`,
      );
      return this.fallbackGenerationConfig[type];
    }

    const normalizedConfig = {
      temperature: config.temperature.toNumber(),
      topP: config.top_p.toNumber(),
      topK: config.top_k,
      maxOutputTokens: config.max_output_tokens,
    };

    this.logger.log(
      `Loaded ai_config id=${config.id} name="${config.name}" type=${config.type} temperature=${normalizedConfig.temperature} topP=${normalizedConfig.topP} topK=${normalizedConfig.topK} maxOutputTokens=${normalizedConfig.maxOutputTokens}`,
    );

    return normalizedConfig;
  }

  private async fetchPromptCommands(type: ai_config_type): Promise<PromptCommandRow[]> {
    const commands = await this.prisma.prompt_commands.findMany({
      where: { type, deleted_at: null },
      orderBy: { display_order: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        display_order: true,
        instruction: true,
      },
    });
    const activeCommands = commands.filter((command) =>
      Boolean(command.instruction?.trim()),
    );
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          client_id: clientId,
          client_secret: clientSecret,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60000),
      });
    } catch (error) {
      // Catches network errors, connection aborts, and timeouts
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown network error';
      throw this.createProviderException(
        503, // Service Unavailable is usually best for network failures
        `Fetch failed: ${errorMessage}`,
        publicMessage,
        operation,
      );
    }

    this.logger.log(
      `Loaded ${activeCommands.length}/${commands.length} prompt_commands for type=${type}: ${activeCommands
        .map(
          (command) =>
            `[${command.display_order}]${command.name}{id=${command.id},chars=${command.instruction?.trim().length ?? 0}}`,
        )
        .join(', ') || 'none'}`,
    );

    return commands;
  }

  private buildTextImprovementPayload(
    originalText: string,
    instruction: string,
    config: GenerationConfig,
  ): object {
    return {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${instruction}\n\nText to improve:\n${originalText}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: config.temperature,
        topP: config.topP,
        topK: config.topK,
        maxOutputTokens: config.maxOutputTokens,
      },
    };
  }

  private buildNewsletterGenerateContentPayload(
    prompt: string,
    config: GenerationConfig,
  ): object {
    return {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: config.temperature,
        topP: config.topP,
        topK: config.topK,
        maxOutputTokens: config.maxOutputTokens,
      },
    };
  }

  private async buildNewsletterGenerationPrompt(
    request: GenerateNewsletterRequestDto,
    templateBlocks: GenerateNewsletterResponseDto['blocks'],
    brandKit: PromptBrandKit,
  ): Promise<string> {
    const promptCommands = await this.fetchPromptCommands(ai_config_type.CREATE);
    const promptLines = promptCommands
      .map((command) => command.instruction?.trim() ?? '')
      .filter(Boolean);

    const promptContext = {
      request: {
        area: request.area,
        templateId: request.templateId,
        brandKitId: request.brandKitId,
        topic: request.topic,
        objective: request.objective,
        audience: request.audience,
        keyMessages: request.keyMessages,
        tone: request.tone,
        relevantDates: request.relevantDates ?? null,
        cta: request.cta ?? null,
        contact: request.contact ?? null,
        linksOrSources: request.linksOrSources,
        additionalContext: request.additionalContext ?? null,
        assetIds: request.assetIds,
      },
      brandKit,
      templateBlocks: templateBlocks.map((block) => ({
        id: block.id,
        type: block.type,
        name: block.name,
        mustFill: block.mustFill,
        editFields: block.editFields.map((field) => ({
          key: field.key,
          type: field.type,
          label: field.label,
          required: field.required ?? false,
        })),
        defaultValues: parseBlockValues(block.content),
      })),
      outputContract: {
        blocks: [
          {
            blockId: 'template-block-id',
            values: {
              fieldKey: 'generated value',
            },
          },
        ],
      },
    };

    const prompt = [
      ...promptLines,
      'Return only valid JSON. Do not include markdown fences or explanations.',
      `Structured context JSON: ${JSON.stringify(promptContext)}`,
    ].join('\n');

    this.logger.log(
      `Built newsletter prompt with ${promptLines.length} DB instructions, templateBlocks=${templateBlocks.length}, brandKitAssets=${brandKit.assets.length}, brandKitColors=${brandKit.colors.length}, brandKitFonts=${brandKit.fonts.length}, requestAssetIds=${request.assetIds.length}`,
    );

    return prompt;
  }

  private async callAiProvider(
    payload: object,
    publicMessage: string,
    operation: 'improveText' | 'generateNewsletter',
  ): Promise<NestleGeniaGenerateContentSuccess | null> {
    const clientId = this.readEnv('CLIENT_ID');
    const clientSecret = this.readEnv('CLIENT_SECRET');
    const url = this.readEnv('NESTLE_GENIA_URL') ?? this.defaultNestleGeniaUrl;

    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException(
        'Nestle GenIA is not configured on the server.',
      );
    }

    this.logger.log(
      `Calling AI provider operation=${operation} provider=nestle model=${this.extractNestleModelName()} url=${url}`,
    );

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          client_id: clientId,
          client_secret: clientSecret,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60000),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown network error';
      throw this.createProviderException(
        503,
        `Fetch failed: ${errorMessage}`,
        publicMessage,
        operation,
      );
    }

    const responseBody = (await response
      .json()
      .catch(() => null)) as NestleGeniaGenerateContentSuccess | null;

    if (!response.ok) {
      throw this.createProviderException(
        response.status,
        this.extractNestleErrorMessage(responseBody, response.status),
        publicMessage,
        operation,
      );
    }

    return responseBody;
  }

  private mapAiConfigToDto(config: {
    id: string;
    name: string;
    type: ai_config_type;
    temperature: { toNumber(): number };
    top_p: { toNumber(): number };
    top_k: number;
    max_output_tokens: number;
    created_at: Date;
    updated_at: Date;
  }): AiConfigResponseDto {
    return {
      id: config.id,
      name: config.name,
      type: config.type,
      temperature: config.temperature.toNumber(),
      top_p: config.top_p.toNumber(),
      top_k: config.top_k,
      max_output_tokens: config.max_output_tokens,
      created_at: config.created_at,
      updated_at: config.updated_at,
    };
  }

  private mapPromptCommandToDto(row: {
    id: string;
    name: string;
    type: ai_config_type;
    display_order: number;
    instruction: string | null;
    created_at: Date;
    updated_at: Date;
  }): PromptCommandResponseDto {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      display_order: row.display_order,
      instruction: row.instruction,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private parseGeneratedNewsletterBlocks(
    rawText: string,
    templateBlocks: GenerateNewsletterResponseDto['blocks'],
  ): Map<string, GeneratedBlockValues> {
    const jsonText = this.extractJsonText(rawText);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText) as unknown;
    } catch {
      throw new BadGatewayException({
        message: this.newsletterGenerationPublicErrorMessage,
      });
    }

    const structuredSchema = z.object({
      blocks: z.array(
        z.object({
          blockId: z.string().trim().min(1),
          values: z.record(z.string(), z.union([z.string(), z.null()])),
        }),
      ),
    });
    const structuredBlocks = structuredSchema.safeParse(parsed);

    if (structuredBlocks.success) {
      const templateBlockMap = new Map(
        templateBlocks.map((block) => [block.id, block] as const),
      );
      const generatedValues = new Map<string, GeneratedBlockValues>();

      structuredBlocks.data.blocks.forEach((block) => {
        const templateBlock = templateBlockMap.get(block.blockId);

        if (!templateBlock) {
          return;
        }

        const defaultValues = parseBlockValues(templateBlock.content);
        const nextValues = Object.fromEntries(
          templateBlock.editFields.map((field) => [
            field.key,
            this.normalizeGeneratedFieldValue(
              field,
              block.values[field.key] as string | null | undefined,
              defaultValues[field.key] ?? '',
            ),
          ]),
        );

        if (Object.keys(nextValues).length > 0) {
          generatedValues.set(block.blockId, nextValues);
        }
      });

      return generatedValues;
    }

    const legacySchema = z.object({
      blocks: z.array(
        z.object({
          id: z.string().trim().min(1),
          name: z.string().trim().min(1),
          text: z.string().trim().min(1),
          backgroundColor: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/),
        }),
      ),
    });
    const legacyBlocks = legacySchema.safeParse(parsed);

    if (legacyBlocks.success) {
      return this.mapLegacyGeneratedBlocks(
        legacyBlocks.data.blocks,
        templateBlocks,
      );
    }

    throw new BadGatewayException({
      message: this.newsletterGenerationPublicErrorMessage,
    });
  }

  private mapLegacyGeneratedBlocks(
    legacyBlocks: Array<{
      id: string;
      name: string;
      text: string;
      backgroundColor: string;
    }>,
    templateBlocks: GenerateNewsletterResponseDto['blocks'],
  ): Map<string, GeneratedBlockValues> {
    return new Map(
      templateBlocks.map((block, index) => {
        const legacyBlock = legacyBlocks[index];
        const defaultValues = parseBlockValues(block.content);
        const firstTextField = block.editFields.find(
          (field) => field.type === 'text' || field.type === 'textarea',
        );
        const firstColorField = block.editFields.find(
          (field) => field.type === 'color',
        );
        const values = { ...defaultValues };

        if (legacyBlock && firstTextField) {
          values[firstTextField.key] = legacyBlock.text.trim();
        }

        if (legacyBlock && firstColorField) {
          values[firstColorField.key] = legacyBlock.backgroundColor.trim();
        }

        return [block.id, values];
      }),
    );
  }

  private normalizeGeneratedFieldValue(
    field: BlockEditField,
    value: string | null | undefined,
    defaultValue: string,
  ): string {
    if (field.type === 'image-asset') {
      return '';
    }

    if (field.type === 'url') {
      return this.isValidHttpUrl(value) ? value.trim() : '';
    }

    if (field.type === 'color') {
      return value?.trim() || defaultValue;
    }

    return value?.trim() || defaultValue;
  }

  private buildUserContentFallbackValues(
    request: GenerateNewsletterRequestDto,
    templateBlocks: GenerateNewsletterResponseDto['blocks'],
    availableFontNames: string[],
  ): Map<string, GeneratedBlockValues> {
    const firstKeyMessage = request.keyMessages[0]?.trim() ?? '';
    const allKeyMessages = request.keyMessages
      .map((message) => message.trim())
      .filter(Boolean)
      .join(' ');
    const firstValidLink =
      request.linksOrSources.find((link) => this.isValidHttpUrl(link))?.trim() ?? '';
    const fallbackByFieldKey: Record<string, string> = {
      title: request.topic.trim(),
      subtitle: request.objective.trim() || request.audience.trim(),
      text: allKeyMessages || request.objective.trim(),
      bodyText: allKeyMessages || request.additionalContext?.trim() || '',
      introText: request.objective.trim() || firstKeyMessage,
      closingText:
        request.additionalContext?.trim() ||
        request.contact?.trim() ||
        request.tone.trim(),
      primaryText: allKeyMessages || request.objective.trim(),
      secondaryText:
        request.additionalContext?.trim() ||
        request.audience.trim() ||
        request.tone.trim(),
      label: firstKeyMessage || request.topic.trim(),
      topLabel: request.topic.trim(),
      bottomLabel: request.tone.trim() || request.audience.trim(),
      buttonLabel: request.cta?.trim() || request.topic.trim(),
      href: firstValidLink,
      altText: request.topic.trim(),
      iconName: request.topic.trim(),
      fontFamily: availableFontNames[0] ?? '',
    };
    const fallbackTextQueue = [
      request.topic.trim(),
      request.objective.trim(),
      request.audience.trim(),
      allKeyMessages,
      request.additionalContext?.trim() ?? '',
      request.relevantDates?.trim() ?? '',
      request.contact?.trim() ?? '',
      request.tone.trim(),
    ].filter(Boolean);

    return new Map(
      templateBlocks.map((block) => {
        const defaultValues = parseBlockValues(block.content);
        let queueIndex = 0;
        const values = Object.fromEntries(
          block.editFields.map((field) => {
            const fieldKey = field.key.trim();
            const normalizedKey = fieldKey.toLowerCase();
            const defaultValue = defaultValues[field.key] ?? '';
            let value = defaultValue;

            if (field.type === 'image-asset') {
              value = '';
            } else if (field.type === 'url') {
              value = firstValidLink || defaultValue;
            } else if (field.type === 'font-family') {
              value = fallbackByFieldKey.fontFamily || defaultValue;
            } else if (field.type === 'font-size' || field.type === 'font-style') {
              value = defaultValue;
            } else if (field.type === 'color') {
              value = defaultValue;
            } else {
              value =
                fallbackByFieldKey[fieldKey] ||
                fallbackByFieldKey[normalizedKey] ||
                this.pickFallbackTextForField(
                  normalizedKey,
                  fallbackTextQueue,
                  queueIndex,
                ) ||
                defaultValue;

              if (
                !fallbackByFieldKey[fieldKey] &&
                !fallbackByFieldKey[normalizedKey] &&
                value
              ) {
                queueIndex += 1;
              }
            }

            return [field.key, value];
          }),
        );

        return [block.id, values];
      }),
    );
  }

  private pickFallbackTextForField(
    fieldKey: string,
    fallbackTextQueue: string[],
    queueIndex: number,
  ): string {
    if (fieldKey.includes('title')) {
      return fallbackTextQueue[0] ?? '';
    }

    if (fieldKey.includes('subtitle')) {
      return fallbackTextQueue[1] ?? fallbackTextQueue[0] ?? '';
    }

    if (
      fieldKey.includes('text') ||
      fieldKey.includes('label') ||
      fieldKey.includes('copy')
    ) {
      return (
        fallbackTextQueue[queueIndex] ??
        fallbackTextQueue[fallbackTextQueue.length - 1] ??
        ''
      );
    }

    return fallbackTextQueue[queueIndex] ?? '';
  }

  private shouldFallbackToUserContent(error: unknown): boolean {
    if (error instanceof BadGatewayException) {
      return true;
    }

    if (error instanceof ServiceUnavailableException) {
      return true;
    }

    if (error instanceof TypeError) {
      return true;
    }

    if (error instanceof HttpException) {
      return false;
    }

    return true;
  }

  private isValidHttpUrl(value: string | null | undefined): value is string {
    if (!value?.trim()) {
      return false;
    }

    try {
      const url = new URL(value.trim());
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private extractJsonText(rawText: string): string {
    const trimmedText = rawText.trim();
    const fencedJson = trimmedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    return fencedJson?.[1]?.trim() ?? trimmedText;
  }

  private extractNestleModelFromUrl(url: string): string {
    const match = url.match(/\/genai\/[^/]+\/([^/]+)\/generateContent$/);
    return match?.[1] ?? 'gemini-2.0-flash-001';
  }

  private extractNestleModelName(): string {
    const url = this.readEnv('NESTLE_GENIA_URL') ?? this.defaultNestleGeniaUrl;
    return (
      this.readEnv('NESTLE_GENIA_MODEL') ?? this.extractNestleModelFromUrl(url)
    );
  }

  private extractNestleErrorMessage(
    responseBody: NestleGeniaGenerateContentSuccess | null,
    responseStatus: number,
  ): string {
    if (typeof responseBody?.error === 'string' && responseBody.error.trim()) {
      return responseBody.error.trim();
    }

    if (
      typeof responseBody?.error === 'object' &&
      responseBody.error?.message?.trim()
    ) {
      return responseBody.error.message.trim();
    }

    return `Nestle GenIA returned status ${responseStatus}.`;
  }

  private extractNestleText(
    responseBody: NestleGeniaGenerateContentSuccess | null,
    model: string,
    publicMessage: string,
    operation: 'improveText' | 'generateNewsletter',
  ): string {
    const candidateText = responseBody?.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text?.trim() ?? '')
      .find((text) => text.length > 0);

    if (candidateText) {
      return candidateText;
    }

    throw this.createProviderException(
      502,
      `Nestle GenIA model ${model} did not return any text content.`,
      publicMessage,
      operation,
    );
  }

  private createProviderException(
    providerStatus: number,
    providerError: string,
    publicMessage: string,
    operation: 'improveText' | 'generateNewsletter',
  ): BadGatewayException {
    this.logger.error(
      `AI ${operation} failed with provider=nestle status=${providerStatus} error=${providerError}`,
    );

    return new BadGatewayException({
      message: publicMessage,
      providerError,
      providerStatus,
      provider: 'nestle',
    });
  }
}
