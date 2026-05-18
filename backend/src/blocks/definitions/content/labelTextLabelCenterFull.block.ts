import { BlockDefinition } from '../../block.definition';

export class LabelTextLabelCenterFullBlock extends BlockDefinition {
  readonly type = 'labelTextLabelCenterFull' as const;
  readonly category = 'CONTENT' as const;
  readonly label = 'Etiqueta Texto Etiqueta Centrado';
  readonly description =
    'Bloque con etiqueta, texto central y etiqueta inferior';
  readonly icon = 'text_fields';
  readonly previewKey = 'LabelTextLabelCenterFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}
