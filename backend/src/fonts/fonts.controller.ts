import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Resource } from '../modules/auth/enum/resources';
import { FontsService } from './fonts.service';
import type {
  UploadedFontFile,
  UploadedFontUpdateDto,
  UploadFontsResponseDto,
} from './dto/upload-font.dto';

@Controller(Resource.FONTS)
export class FontsController {
  constructor(private readonly fontsService: FontsService) {}

  @Get()
  listFonts(
    @Headers('authorization') authorization: string | undefined,
    @Query('groupName') groupName?: string,
  ): Promise<UploadFontsResponseDto> {
    this.fontsService.assertAuthenticatedRequest(authorization);
    return this.fontsService.listFonts(groupName);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files', 5))
  uploadFonts(
    @Headers('authorization') authorization: string | undefined,
    @Body('groupName') groupName: string | undefined,
    @UploadedFiles() files: UploadedFontFile[] | undefined,
  ): Promise<UploadFontsResponseDto> {
    this.fontsService.assertAuthenticatedRequest(authorization);

    if (!files?.length) {
      throw new BadRequestException('Debe cargar al menos un archivo.');
    }

    if (!groupName?.trim()) {
      throw new BadRequestException(
        'Debe indicar un grupo de fuentes valido.',
      );
    }

    return this.fontsService.uploadFonts(files, groupName);
  }

  @Patch(':id')
  updateFont(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: UploadedFontUpdateDto,
  ) {
    this.fontsService.assertAuthenticatedRequest(authorization);
    return this.fontsService.updateFont(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteFont(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ): Promise<void> {
    this.fontsService.assertAuthenticatedRequest(authorization);
    await this.fontsService.deleteFont(id);
  }
}
