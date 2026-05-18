import { BlockDefinition } from '../../block.definition';

export class TextDoubleCenterBackgroundFullBlock extends BlockDefinition {
  readonly type = 'textDoubleCenterBackgroundFull' as const;
  readonly category = 'CONTENT' as const;
  readonly label = 'Doble Texto Centrado con Fondo';
  readonly description = 'Dos bloques de texto centrados con fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'TextDoubleCenterBackgroundFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}
