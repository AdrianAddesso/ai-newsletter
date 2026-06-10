import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ai_config_type } from '@prisma/client';
import { AiService } from './ai.service';
import type {
  ImproveTextRequestDto,
  ImproveTextResponseDto,
} from './dto/improve-text.dto';
import type {
  GenerateNewsletterRequestDto,
  GenerateNewsletterResponseDto,
} from './dto/generate-newsletter.dto';
import { generateNewsletterBodySchema } from './dto/generate-newsletter.dto';
import {
  updateAiConfigBodySchema,
  type AiConfigResponseDto,
  type UpdateAiConfigDto,
} from './dto/ai-config.dto';
import {
  createPromptCommandBodySchema,
  updatePromptCommandBodySchema,
  type CreatePromptCommandDto,
  type PromptCommandResponseDto,
  type UpdatePromptCommandDto,
} from './dto/prompt-commands.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Resource } from '../modules/auth/enum/resources';
import { ZodValidationPipe } from '../common/zod/zod-validation.pipe';

@Controller(Resource.AI)
@UseGuards(JwtGuard)
export class AiController {
    constructor(private readonly aiService: AiService) {}

    // ─── Newsletter operations ────────────────────────────────────────────────

    @Post('improve-text')
    improveText(
        @Body() body: ImproveTextRequestDto,
    ): Promise<ImproveTextResponseDto> {
        return this.aiService.improveText(body);
    }

    @Post('generate-newsletter')
    generateNewsletter(
        @Body(new ZodValidationPipe(generateNewsletterBodySchema))
        body: GenerateNewsletterRequestDto,
    ): Promise<GenerateNewsletterResponseDto> {
        return this.aiService.generateNewsletter(body);
    }

    // ─── AI Config ────────────────────────────────────────────────────────────

    @Get('ai-config')
    getAiConfigs(): Promise<AiConfigResponseDto[]> {
        return this.aiService.getAiConfigs();
    }

    @Patch('ai-config/:id')
    updateAiConfig(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(updateAiConfigBodySchema))
        body: UpdateAiConfigDto,
    ): Promise<AiConfigResponseDto> {
        return this.aiService.updateAiConfig(id, body);
    }

    // ─── Prompt Commands ──────────────────────────────────────────────────────

    @Get('prompt-commands')
    getPromptCommands(
        @Query('type') type?: ai_config_type,
    ): Promise<PromptCommandResponseDto[]> {
        return this.aiService.getPromptCommands(type);
    }

    @Post('prompt-commands')
    createPromptCommand(
        @Body(new ZodValidationPipe(createPromptCommandBodySchema))
        body: CreatePromptCommandDto,
    ): Promise<PromptCommandResponseDto> {
        return this.aiService.createPromptCommand(body);
    }

    @Patch('prompt-commands/:id')
    updatePromptCommand(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(updatePromptCommandBodySchema))
        body: UpdatePromptCommandDto,
    ): Promise<PromptCommandResponseDto> {
        return this.aiService.updatePromptCommand(id, body);
    }

    @Delete('prompt-commands/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    deletePromptCommand(@Param('id') id: string): Promise<void> {
        return this.aiService.deletePromptCommand(id);
    }
}
