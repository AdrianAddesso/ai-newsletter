import { BlockDefinition } from '../../block.definition';

export class LabelLeftBackgroundFullBlock extends BlockDefinition {
  readonly type = 'labelLeftBackgroundFull' as const;
  readonly category = 'CONTENT' as const;
  readonly label = 'Etiqueta Izquierda con Fondo';
  readonly description = 'Etiqueta destacada alineada a la izquierda con fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'asset1.jpg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}
