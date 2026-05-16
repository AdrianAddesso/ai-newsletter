import { BlockDefinition } from '../../block.definition';

export class TextLabelCenterBackgroundFullBlock extends BlockDefinition {
  readonly type = 'CONTENT' as const;
  readonly label = 'Texto y Etiqueta Centrada con Fondo';
  readonly description =
    'Texto alineado a la izquierda con etiqueta centrada debajo y fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'asset1.jpg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}