import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockRegistry } from './block.registry';
import {
  BlockDefinitionDTO, BlockInstance,} from '../../../packages/shared/src/types/block.types.js';

@Injectable()
export class BlockService {
  private registry = BlockRegistry.getInstance();

  constructor(private readonly prisma: PrismaService) {}

  listDefinitions(): BlockDefinitionDTO[] {
    return this.registry.getAll().map((b) => b.toDTO());
  }

  async saveBlocks(
    templateId: string,
    blocks: Omit<BlockInstance, 'localId'>[],
  ) {
    return this.prisma.$transaction([
      this.prisma.newsletter_blocks.deleteMany({
        where: { newsletter_id: templateId },
      }),
      this.prisma.block_content.createMany({
          data: blocks.map((b) => ({
          type: b.type,
          content: b.content,
          must_fill: b.mustFill,
          display_order: b.displayOrder,
        })),
      }),
    ]);
  }
}
