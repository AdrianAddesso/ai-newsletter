import { Body, Controller, Post } from '@nestjs/common';
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
import { Resource } from '../modules/auth/enum/resources';
import { ZodValidationPipe } from '../common/zod/zod-validation.pipe';

@Controller(Resource.AI)
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
