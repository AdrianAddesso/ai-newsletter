import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
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
import { Resource } from '../modules/auth/enum/resources';
import { ZodValidationPipe } from '../common/zod/zod-validation.pipe';

@Controller(Resource.AI)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('improve-text')
  improveText(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: ImproveTextRequestDto,
  ): Promise<ImproveTextResponseDto> {
    this.assertAuthenticated(authorization);
    return this.aiService.improveText(body);
  }

  @Post('generate-newsletter')
  generateNewsletter(
    @Headers('authorization') authorization: string | undefined,
    @Body(new ZodValidationPipe(generateNewsletterBodySchema))
    body: GenerateNewsletterRequestDto,
  ): Promise<GenerateNewsletterResponseDto> {
    this.assertAuthenticated(authorization);
    return this.aiService.generateNewsletter(body);
  }

  private assertAuthenticated(authorization: string | undefined): void {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication is required');
    }
  }
}
