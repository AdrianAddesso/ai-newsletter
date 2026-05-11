import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockRegistry } from './block.registry';
import {  BlockContentType,  BlockDefinitionDTO,} from '@shared/types/block.types';

export type SaveTemplateBlockInput = {
  type: BlockContentType;
  content?: string | null;
  mustFill?: boolean;
  displayOrder?: number;
};

export type SaveTemplateBlocksResponse = {
  templateId: string;
  savedCount: number;
};

@Injectable()
export class BlockService {
  private readonly registry = BlockRegistry.getInstance();

  constructor(private readonly prisma: PrismaService) {}

  listDefinitions(): BlockDefinitionDTO[] {
    return this.registry.getAll().map((block) => block.toDTO());
  }

  async saveTemplateBlocks(
    templateId: string,
    blocks: SaveTemplateBlockInput[],
  ): Promise<SaveTemplateBlocksResponse> {
    const template = await this.prisma.templates.findUnique({
      where: { id: templateId },
      select: { id: true },
    });

    if (!template) {
      throw new NotFoundException('No se encontro el template solicitado.');
    }

    const normalizedBlocks = blocks.map((block, index) => {
      const definition = this.registry.getByType(block.type);

      if (!definition) {
        throw new BadRequestException(
          'El tipo de bloque indicado no esta disponible.',
        );
      }

      return {
        type: block.type,
        content: block.content ?? definition.defaultContent,
        mustFill: block.mustFill ?? definition.mustFill,
        displayOrder: block.displayOrder ?? index,
      };
    });

    await this.prisma.templates.update({
      where: { id: templateId },
      data: {
        layout: JSON.stringify({ blocks: normalizedBlocks }),
      },
    });

    return {
      templateId,
      savedCount: normalizedBlocks.length,
    };
  }
}
