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
import { PrismaService } from '../prisma/prisma.service';
import { z } from 'zod';
import {
  ImproveTextRequestDto,
  ImproveTextResponseDto,
} from './dto/improve-text.dto';
import {
  GenerateNewsletterRequestDto,
  GenerateNewsletterResponseDto,
} from './dto/generate-newsletter.dto';
import { NestleGeniaGenerateContentSuccess } from './ai.types';
import {
  buildNewsletterBlockId,
  buildNewsletterBlocksFromLayout,
  getBlockEditFields,
  normalizeTemplateLayout,
  parseBlockValues,
} from '../blocks/newsletter-blocks';
import type { BlockEditField } from '@shared/types/block.types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly textImprovementPublicErrorMessage =
    'No se pudo mejorar el texto en este momento.';
  private readonly newsletterGenerationPublicErrorMessage =
    'No se pudo generar el newsletter en este momento.';
  private readonly textImprovementInstruction =
    'You are a Spanish copy editor for internal Nestle newsletters. Improve the text for clarity, fluency, tone, and readability while keeping the original meaning. Return only the improved text in Spanish, with no markdown, bullets, or explanations.';
  private readonly defaultNestleGeniaUrl =
    'https://eur-sdr-int-pub.nestle.com/api/dv-exp-sandbox-openai-api/1/genai/GCP/gemini-2.0-flash-001/generateContent';

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
    const prompt = this.buildNewsletterGenerationPrompt(
      request,
      template.layout,
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
    let generatedValues: Map<string, Record<string, string | null | undefined>>;

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

  private readEnv(key: string): string | null {
    const value = this.configService.get<string>(key)?.trim();
    return value ? value : null;
  }

  private async improveTextWithAi(
    originalText: string,
  ): Promise<ImproveTextResponseDto> {
    const responseBody = await this.callAiProvider(
      this.buildTextImprovementPayload(originalText),
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
    const responseBody = await this.callAiProvider(
      this.buildNewsletterGenerateContentPayload(prompt),
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

  private buildTextImprovementPayload(originalText: string): object {
    return {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${this.textImprovementInstruction}\n\nText to improve:\n${originalText}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 20,
        maxOutputTokens: 4000,
      },
    };
  }

  private buildNewsletterGenerateContentPayload(prompt: string): object {
    return {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        topP: 0.8,
        topK: 20,
        maxOutputTokens: 4000,
      },
    };
  }

  private buildNewsletterGenerationPrompt(
    request: GenerateNewsletterRequestDto,
    layout: unknown,
    brandKitResources: {
      name: string;
      assets: Array<{ id: string; name: string; type: string }>;
      colors: Array<{ id: string; name: string; hex: string }>;
      fonts: Array<{ id: string; name: string; style: string; groupName: string }>;
    },
  ): string {
    const normalizedLayout = normalizeTemplateLayout(layout);
    const blocks = normalizedLayout.map((layoutBlock, index) => {
      const type = layoutBlock.type ?? layoutBlock.block_type;

      if (!type) {
        throw new BadRequestException('La plantilla seleccionada contiene un bloque sin tipo.');
      }

      const editFields = getBlockEditFields(type);

      return {
        blockId: buildNewsletterBlockId(type, layoutBlock, index),
        blockType: type,
        row: layoutBlock.row,
        gridColumn: layoutBlock.grid_column,
        displayOrder: layoutBlock.display_order,
        editableFields: editFields.map((field) => ({
          key: field.key,
          label: field.label,
          type: field.type,
          required: field.required ?? false,
          assetTypes: field.assetTypes ?? [],
          defaultValue: field.defaultValue ?? '',
        })),
      };
    });

    const promptContext = {
      area: request.area,
      templateId: request.templateId,
      brandKitId: request.brandKitId,
      brandKitName: brandKitResources.name,
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
      availableBrandKitAssets: brandKitResources.assets,
      availableBrandKitColors: brandKitResources.colors,
      availableBrandKitFonts: brandKitResources.fonts,
      templateBlocks: blocks,
    };

    return [
      'You are a Spanish copywriter for internal Nestle newsletters.',
      'Generate concise, brand-safe newsletter copy in Spanish for an internal communications team.',
      'Return only valid JSON with this exact shape:',
      '{"blocks":[{"blockId":"...","values":{"fieldKey":"value"}}]}',
      'For each block, return only the exact field keys listed in templateBlocks.editableFields.',
      'If a field type is image-asset, leave it as an empty string.',
      'If a field type is url and no valid user-provided source exists, leave it as an empty string.',
      'If a field type is font-family, choose one of the provided brand kit fonts when possible.',
      'Do not include markdown, comments, explanations, HTML, or fields not shown in the schema.',
      'Use the supplied structured context as the only source material.',
      `Structured context JSON: ${JSON.stringify(promptContext)}`,
    ].join('\n');
  }

  private parseGeneratedNewsletterBlocks(
    rawText: string,
    templateBlocks: GenerateNewsletterResponseDto['blocks'],
  ): Map<string, Record<string, string | null | undefined>> {
    const jsonText = this.extractJsonText(rawText);
    const responseSchema = z.object({
      blocks: z.array(
        z.object({
          blockId: z.string().trim().min(1),
          values: z.record(z.string(), z.union([z.string(), z.null()])),
        }),
      ),
    });
    let parsed: unknown;

    try {
      parsed = JSON.parse(jsonText) as unknown;
    } catch {
      throw new BadGatewayException({
        message: this.newsletterGenerationPublicErrorMessage,
      });
    }

    const blockSchema = responseSchema.safeParse(parsed);

    if (!blockSchema.success) {
      throw new BadGatewayException({
        message: this.newsletterGenerationPublicErrorMessage,
      });
    }

    const templateBlockMap = new Map(
      templateBlocks.map((block) => [block.id, block]),
    );
    const generatedValues = new Map<
      string,
      Record<string, string | null | undefined>
    >();

    blockSchema.data.blocks.forEach((block) => {
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
            block.values[field.key],
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

  private normalizeGeneratedFieldValue(
    field: BlockEditField,
    value: string | null | undefined,
    defaultValue: string,
  ): string {
    if (field.type === 'image-asset') {
      return '';
    }

    if (field.type === 'url') {
      return this.isValidHttpUrl(value) ? value!.trim() : '';
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
  ): Map<string, Record<string, string | null | undefined>> {
    const firstKeyMessage = request.keyMessages[0]?.trim() ?? '';
    const allKeyMessages = request.keyMessages
      .map((message) => message.trim())
      .filter(Boolean)
      .join(' ');
    const firstValidLink =
      request.linksOrSources.find((link) => this.isValidHttpUrl(link))?.trim() ??
      '';
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

  private isValidHttpUrl(value: string | null | undefined): boolean {
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
