import { BlockDefinition } from '../../block.definition';

export class TextDoubleCenterBackgroundFullBlock extends BlockDefinition {
  readonly type = 'CONTENT' as const;
  readonly label = 'Doble Texto Centrado con Fondo';
  readonly description = 'Dos bloques de texto centrados con fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'asset1.jpg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}