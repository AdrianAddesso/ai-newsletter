import type {
  BlockContentType,
  BlockDefinitionDTO,
} from '../../../packages/shared/src/types/block.types.js';



export abstract class BlockDefinition {
  abstract readonly type: BlockContentType;
  abstract readonly label: string;
  abstract readonly description: string;
  abstract readonly icon: string;
  abstract readonly mustFill: boolean;
  abstract readonly layout: BlockDefinitionDTO['layout'];

  defaultContent: string | null = null;

  toDTO(): BlockDefinitionDTO {
    return {
      type: this.type,
      label: this.label,
      description: this.description,
      icon: this.icon,
      defaultContent: this.defaultContent,
      mustFill: this.mustFill,
      layout: this.layout,
    };
  }
}
