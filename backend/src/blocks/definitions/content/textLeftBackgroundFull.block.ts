import { BlockDefinition } from '../../block.definition';

export class TextLeftBackgroundFullBlock extends BlockDefinition {
  readonly type = 'textLeftBackgroundFull' as const;
  readonly category = 'CONTENT' as const;
  readonly label = 'Texto Izquierda con Fondo';
  readonly description = 'Texto alineado a la izquierda con fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'TextLeftBackgroundFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}
