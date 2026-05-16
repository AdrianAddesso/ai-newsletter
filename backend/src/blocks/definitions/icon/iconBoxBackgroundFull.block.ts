import { BlockDefinition } from '../../block.definition';

export class IconBoxBackgroundFullBlock extends BlockDefinition {
  readonly type = 'ICONS' as const;
  readonly label = 'Iconos multiples con fondo';
  readonly description = 'Este es el bloque de multiples iconos con fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'asset1.jpg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}