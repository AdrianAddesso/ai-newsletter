import { BlockDefinition } from '../../block.definition';

export class TextCenterBackgroundFullBlock extends BlockDefinition {
  readonly type = 'textCenterBackgroundFull' as const;
  readonly category = 'CONTENT' as const;
  readonly label = 'Texto Centrado con Fondo';
  readonly description = 'Texto centrado horizontalmente con fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'TextCenterBackgroundFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}
