import type {  BlockContentType,  BlockDefinitionDTO,} from '@shared/types/block.types';

export abstract class BlockDefinition {
  abstract readonly type: string;
  abstract readonly category: BlockContentType;
  abstract readonly label: string;
  abstract readonly description: string;
  abstract readonly icon: string;
  abstract readonly previewKey: string;
  abstract readonly mustFill: boolean;
  abstract readonly layout: BlockDefinitionDTO['layout'];
  defaultContent: string | null = null;

  toDTO(): BlockDefinitionDTO {
    return {
      type: this.type,
      category: this.category,
      label: this.label,
      description: this.description,
      icon: this.icon,
      previewKey: this.previewKey,
      defaultContent: this.defaultContent,
      mustFill: this.mustFill,
      layout: this.layout,
    };
  }
}
