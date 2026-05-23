import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ai_config_type } from '@prisma/client';
import { z } from 'zod';
import {
  ImproveTextRequestDto,
  ImproveTextResponseDto,
} from './dto/improve-text.dto';
import {
  GenerateNewsletterRequestDto,
  GenerateNewsletterResponseDto,
  GeneratedNewsletterBlockDto,
} from './dto/generate-newsletter.dto';
import { AiConfigResponseDto, UpdateAiConfigDto } from './dto/ai-config.dto';
import {
  CreatePromptCommandDto,
  PromptCommandResponseDto,
  UpdatePromptCommandDto,
} from './dto/prompt-commands.dto';
import {
  GenerationConfig,
  NestleGeniaGenerateContentSuccess,
} from './ai.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);

    private readonly textImprovementPublicErrorMessage =
        'No se pudo mejorar el texto en este momento.';
    private readonly newsletterGenerationPublicErrorMessage =
        'No se pudo generar el newsletter en este momento.';
    private readonly defaultNestleGeniaUrl =
        'https://eur-sdr-int-pub.nestle.com/api/dv-exp-sandbox-openai-api/1/genai/GCP/gemini-2.0-flash-001/generateContent';

    // Hardcoded fallbacks used only when no DB row exists for a given type.
    private readonly fallbackGenerationConfig: Record<
        ai_config_type,
        GenerationConfig
    > = {
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

    // ─── Public: AI operations ────────────────────────────────────────────────

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
        const prompt = await this.buildNewsletterGenerationPrompt(request);
        const generatedText = await this.generateNewsletterWithAi(prompt);

        return { blocks: this.parseGeneratedNewsletterBlocks(generatedText) };
    }

    // ─── Public: AI Config CRUD ───────────────────────────────────────────────

    async getAiConfigs(): Promise<AiConfigResponseDto[]> {
        const rows = await this.prisma.ai_config.findMany({
        where: { deleted_at: null },
        orderBy: { created_at: 'asc' },
        });
        return rows.map((r) => this.mapAiConfigToDto(r));
    }

    async updateAiConfig(
        id: string,
        dto: UpdateAiConfigDto,
    ): Promise<AiConfigResponseDto> {
        const existing = await this.prisma.ai_config.findFirst({
        where: { id, deleted_at: null },
        });
        if (!existing) {
        throw new NotFoundException('Configuración de IA no encontrada.');
        }

        const updated = await this.prisma.ai_config.update({
        where: { id },
        data: { ...dto, updated_at: new Date() },
        });
        return this.mapAiConfigToDto(updated);
    }

    // ─── Public: Prompt Commands CRUD ────────────────────────────────────────

    async getPromptCommands(
        type?: ai_config_type,
    ): Promise<PromptCommandResponseDto[]> {
        const rows = await this.prisma.prompt_commands.findMany({
        where: { deleted_at: null, ...(type ? { type } : {}) },
        orderBy: [{ type: 'asc' }, { display_order: 'asc' }],
        });
        return rows.map((r) => this.mapPromptCommandToDto(r));
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
        throw new NotFoundException('Instrucción de prompt no encontrada.');
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
        throw new NotFoundException('Instrucción de prompt no encontrada.');
        }

        await this.prisma.prompt_commands.update({
        where: { id },
        data: { deleted_at: new Date() },
        });
    }

    // ─── Private: Core AI calls ───────────────────────────────────────────────

    private async improveTextWithAi(
        originalText: string,
    ): Promise<ImproveTextResponseDto> {
        const [promptLines, genConfig] = await Promise.all([
        this.fetchPromptLines(ai_config_type.REGENERATE),
        this.fetchGenerationConfig(ai_config_type.REGENERATE),
        ]);

        const payload = this.buildTextImprovementPayload(
        originalText,
        promptLines.join('\n'),
        genConfig,
        );

        const responseBody = await this.callAiProvider(
        payload,
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
        const payload = this.buildNewsletterGenerateContentPayload(
        prompt,
        genConfig,
        );

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

    // ─── Private: DB fetchers ─────────────────────────────────────────────────

    private async fetchGenerationConfig(
        type: ai_config_type,
    ): Promise<GenerationConfig> {
        const config = await this.prisma.ai_config.findFirst({
        where: { type, deleted_at: null },
        });

        if (!config) {
        this.logger.warn(
            `No ai_config found for type=${type}. Using hardcoded fallback.`,
        );
        return this.fallbackGenerationConfig[type];
        }

        return {
        temperature: config.temperature.toNumber(),
        topP: config.top_p.toNumber(),
        topK: config.top_k,
        maxOutputTokens: config.max_output_tokens,
        };
    }

    private async fetchPromptLines(type: ai_config_type): Promise<string[]> {
        const commands = await this.prisma.prompt_commands.findMany({
        where: { type, deleted_at: null },
        orderBy: { display_order: 'asc' },
        });

        return commands.map((c) => c.instruction?.trim() ?? '').filter(Boolean);
    }

    // ─── Private: Payload builders ────────────────────────────────────────────

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
                { text: `${instruction}\n\nText to improve:\n${originalText}` },
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
    ): Promise<string> {
        const promptLines = await this.fetchPromptLines(ai_config_type.CREATE);

        const promptContext = {
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
        };

        return [
        ...promptLines,
        `Structured context JSON: ${JSON.stringify(promptContext)}`,
        ].join('\n');
    }

    // ─── Private: HTTP call ───────────────────────────────────────────────────

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

        const response = await fetch(url, {
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

    // ─── Private: Mappers ─────────────────────────────────────────────────────

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

    // ─── Private: Utilities ───────────────────────────────────────────────────

    private readEnv(key: string): string | null {
        const value = this.configService.get<string>(key)?.trim();
        return value ? value : null;
    }

    private parseGeneratedNewsletterBlocks(
        rawText: string,
    ): GeneratedNewsletterBlockDto[] {
        const jsonText = this.extractJsonText(rawText);

        const responseSchema = z.object({
        blocks: z
            .array(
            z.object({
                id: z.string().trim().min(1),
                name: z.string().trim().min(1),
                text: z.string().trim().min(1),
                backgroundColor: z
                .string()
                .trim()
                .regex(/^#[0-9A-Fa-f]{6}$/),
            }),
            )
            .min(1),
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

        return blockSchema.data.blocks;
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

        if (candidateText) return candidateText;

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
