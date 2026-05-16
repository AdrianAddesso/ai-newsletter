import { BlockDefinition } from '../../block.definition';

export class LabelLeftBackgroundSmallBlock extends BlockDefinition {
  readonly type = 'CONTENT' as const;
  readonly label = 'Etiqueta Izquierda Pequeña con Fondo';
  readonly description =
    'Etiqueta destacada pequeña alineada a la izquierda con fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'asset1.jpg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}