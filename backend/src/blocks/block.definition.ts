import type {
  BlockContentType,
  BlockDefinitionDTO,
  BlockEditField,
} from '@shared/types/block.types';

export abstract class BlockDefinition {
  private static readonly universalEditFields: BlockEditField[] = [
    {
      key: 'url',
      label: 'URL',
      type: 'url',
      placeholder: 'https://',
      defaultValue: '',
    },
  ];

  abstract readonly type: string;
  abstract readonly category: BlockContentType;
  abstract readonly label: string;
  abstract readonly description: string;
  abstract readonly icon: string;
  abstract readonly previewKey: string;
  abstract readonly mustFill: boolean;
  abstract readonly layout: BlockDefinitionDTO['layout'];
  /** Editable fields exposed to the newsletter editor. Override per block. */
  readonly editFields: BlockEditField[] = [];

  /**
   * Block-specific fields plus universal fields shared by every block.
   * Avoids rewriting every concrete definition while keeping the registry pattern intact.
   */
  private get resolvedEditFields(): BlockEditField[] {
    const hasUniversalUrlField = this.editFields.some((field) => field.key === 'url');

    if (hasUniversalUrlField) {
      return this.editFields;
    }

    return [...this.editFields, ...BlockDefinition.universalEditFields];
  }

  /**
   * Serialized default content derived from editFields.
   * Returns null when the block has no editable fields.
   */
  get defaultContent(): string | null {
    if (this.resolvedEditFields.length === 0) {
      return null;
    }

    return JSON.stringify(
      Object.fromEntries(
        this.resolvedEditFields.map((field) => [
          field.key,
          field.defaultValue ?? '',
        ]),
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
      editFields: this.resolvedEditFields,
    };
  }
}
