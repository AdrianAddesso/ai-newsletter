import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
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
import { MockAuthGuard } from '../modules/auth/guards/mockup.guard';
import { Resource } from '../modules/auth/enum/resources';
import { ZodValidationPipe } from '../common/zod/zod-validation.pipe';

@Controller(Resource.AI)
@UseGuards(MockAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

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
}
