import type {
  BlockContentType,
  BlockDefinitionDTO,
  BlockEditField,
} from '@shared/types/block.types';

export abstract class BlockDefinition {
  abstract readonly type: string;
  abstract readonly category: BlockContentType;
  abstract readonly label: string;
  abstract readonly description: string;
  abstract readonly icon: string;
  abstract readonly previewKey: string;
  abstract readonly mustFill: boolean;
  abstract readonly layout: BlockDefinitionDTO['layout'];
  readonly editFields: BlockEditField[] = [];

  get defaultContent(): string | null {
    if (this.editFields.length === 0) {
      return null;
    }

    return JSON.stringify(
      Object.fromEntries(
        this.editFields.map((field) => [field.key, field.defaultValue ?? '']),
      ),
    );
  }

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
      editFields: this.editFields,
    };
  }
}
