import { BlockDefinition } from '../../block.definition';

export class LabelLeftBackgroundSmallBlock extends BlockDefinition {
  readonly type = 'labelLeftBackgroundSmall' as const;
  readonly category = 'CONTENT' as const;
  readonly label = 'Etiqueta Izquierda Pequeña con Fondo';
  readonly description =
    'Etiqueta destacada pequeña alineada a la izquierda con fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'LabelLeftBackgroundSmallRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}
