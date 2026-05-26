import {
  type BlockAssetType,
  type BlockContentType,
  type BlockEditField,
} from '@shared/types/block.types';
import { BadRequestException } from '@nestjs/common';
import { BlockRegistry } from './block.registry';

export type TemplateLayoutBlock = {
  type?: string | null;
  block_type?: string | null;
  content?: string | null;
  row: number;
  grid_column: number;
  display_order: number;
  mustFill?: boolean;
};

export type NewsletterAssetBindingDto = {
  fieldKey: string;
  assetId: string;
  assetName: string | null;
  assetUrl: string | null;
  assetType: BlockAssetType;
  keywordText?: string | null;
};

export type NewsletterBlockDto = {
  id: string;
  type: string;
  category: BlockContentType;
  name: string;
  content: string | null;
  row: number;
  gridColumn: number;
  displayOrder: number;
  mustFill: boolean;
  comment: string | null;
  editFields: BlockEditField[];
  assetBindings: NewsletterAssetBindingDto[];
};

const blockRegistry = BlockRegistry.getInstance();

export function normalizeTemplateLayout(layout: unknown): TemplateLayoutBlock[] {
  const candidate = Array.isArray(layout)
    ? layout
    : isRecord(layout) && Array.isArray(layout.blocks)
      ? layout.blocks
      : null;

  if (!candidate) {
    throw new BadRequestException('La plantilla seleccionada no tiene un layout valido.');
  }

  return candidate.map((block, index) => {
    if (!isRecord(block)) {
      throw new BadRequestException('La plantilla seleccionada tiene bloques invalidos.');
    }

    const row = toInteger(block.row, `row[${index}]`);
    const gridColumn = toInteger(block.grid_column, `grid_column[${index}]`);
    const displayOrder = toInteger(
      block.display_order ?? index,
      `display_order[${index}]`,
    );

    return {
      type: typeof block.type === 'string' ? block.type : null,
      block_type:
        typeof block.block_type === 'string' ? block.block_type : null,
      content: typeof block.content === 'string' ? block.content : null,
      row,
      grid_column: gridColumn,
      display_order: displayOrder,
      mustFill:
        typeof block.mustFill === 'boolean'
          ? block.mustFill
          : typeof block.must_fill === 'boolean'
            ? block.must_fill
            : undefined,
    };
  });
}

export function buildNewsletterBlockId(
  type: string,
  layoutBlock: TemplateLayoutBlock,
  index: number,
): string {
  return `${type}-${layoutBlock.row}-${layoutBlock.grid_column}-${layoutBlock.display_order}-${index}`;
}

export function parseBlockValues(
  content: string | null | undefined,
): Record<string, string> {
  if (!content) {
    return {};
  }

  try {
    const parsed = JSON.parse(content) as unknown;

    if (!isRecord(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );
  } catch {
    return {};
  }
}

export function serializeBlockValues(
  values: Record<string, string | null | undefined>,
): string | null {
  const normalizedEntries = Object.entries(values).map(([key, value]) => [
    key,
    value ?? '',
  ]);

  if (normalizedEntries.length === 0) {
    return null;
  }

  return JSON.stringify(Object.fromEntries(normalizedEntries));
}

export function buildNewsletterBlocksFromLayout(
  layout: unknown,
  valuesByBlockId?: Map<string, Record<string, string | null | undefined>>,
): NewsletterBlockDto[] {
  const normalizedLayout = normalizeTemplateLayout(layout);

  return normalizedLayout.map((layoutBlock, index) => {
    const type = layoutBlock.type ?? layoutBlock.block_type;

    if (!type) {
      throw new BadRequestException('La plantilla seleccionada contiene un bloque sin tipo.');
    }

    const definition = blockRegistry.getByType(type);

    if (!definition) {
      throw new BadRequestException(
        `El template contiene un tipo de bloque no soportado: ${type}.`,
      );
    }

    const blockId = buildNewsletterBlockId(type, layoutBlock, index);
    const defaultValues = parseBlockValues(definition.defaultContent);
    const providedValues = valuesByBlockId?.get(blockId) ?? {};
    const mergedValues = Object.fromEntries(
      definition.editFields.map((field) => [
        field.key,
        providedValues[field.key] ?? defaultValues[field.key] ?? '',
      ]),
    );

    return {
      id: blockId,
      type,
      category: definition.category,
      name: definition.label,
      content: serializeBlockValues(mergedValues),
      row: layoutBlock.row,
      gridColumn: layoutBlock.grid_column,
      displayOrder: layoutBlock.display_order,
      mustFill: layoutBlock.mustFill ?? definition.mustFill,
      comment: null,
      editFields: definition.editFields,
      assetBindings: [],
    };
  });
}

export function getBlockEditFields(type: string): BlockEditField[] {
  return getBlockDefinition(type).editFields;
}

export function getBlockDefinition(type: string) {
  const definition = blockRegistry.getByType(type);

  if (!definition) {
    throw new BadRequestException(`Tipo de bloque no soportado: ${type}.`);
  }

  return definition;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toInteger(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new BadRequestException(`El layout de la plantilla contiene ${fieldName} invalido.`);
  }

  return value;
}
