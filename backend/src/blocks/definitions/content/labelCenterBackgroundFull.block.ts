import { BlockDefinition } from '../../block.definition';

export class LabelCenterBackgroundFullBlock extends BlockDefinition {
  readonly type = 'labelCenterBackgroundFull' as const;
  readonly category = 'CONTENT' as const;
  readonly label = 'Etiqueta Centrada con Fondo';
  readonly description = 'Etiqueta destacada centrada con fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'LabelCenterBackgroundFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
  readonly editFields = [
    { key: 'label', label: 'Etiqueta', type: 'text' as const, required: true, defaultValue: 'Lorem ipsum dolor sit amet' },
    { key: 'bgColor', label: 'Color de fondo', type: 'color' as const },
  ];
}
