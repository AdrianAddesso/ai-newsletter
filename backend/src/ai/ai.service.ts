import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { NestleGeniaGenerateContentSuccess } from './ai.types';

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

  constructor(private readonly configService: ConfigService) {}

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
    const prompt = this.buildNewsletterGenerationPrompt(request);
    const generatedText = await this.generateNewsletterWithAi(prompt);

    return {
      blocks: this.parseGeneratedNewsletterBlocks(generatedText),
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
  ): string {
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
      'You are a Spanish copywriter for internal Nestle newsletters.',
      'Generate concise, brand-safe newsletter copy in Spanish for an internal communications team.',
      'Return only valid JSON with this exact shape:',
      '{"blocks":[{"id":"header","name":"Encabezado","text":"...","backgroundColor":"#FFFFFF"},{"id":"headline","name":"Titulo principal","text":"...","backgroundColor":"#97CAEB"},{"id":"body","name":"Cuerpo","text":"...","backgroundColor":"#FFFFFF"},{"id":"cta","name":"Llamado a la accion","text":"...","backgroundColor":"#FFC600"}]}',
      'Do not include markdown, comments, explanations, HTML, or fields not shown in the schema.',
      'Use the supplied structured context as the only source material. If a value is missing, write a neutral internal-newsletter fallback.',
      `Structured context JSON: ${JSON.stringify(promptContext)}`,
    ].join('\n');
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
