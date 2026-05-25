import { BlockDefinition } from '../../block.definition';

export class LabelTextLabelCenterFullBlock extends BlockDefinition {
  readonly type = 'labelTextLabelCenterFull' as const;
  readonly category = 'CONTENT' as const;
  readonly label = 'Etiqueta Texto Etiqueta Centrado';
  readonly description = 'Bloque con etiqueta, texto central y etiqueta inferior';
  readonly icon = 'text_fields';
  readonly previewKey = 'LabelTextLabelCenterFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
  readonly editFields = [
    { key: 'topLabel', label: 'Etiqueta superior', type: 'text' as const, defaultValue: 'Lorem ipsum dolor sit amet' },
    { key: 'bodyText', label: 'Texto principal', type: 'textarea' as const, required: true, defaultValue: 'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.' },
    { key: 'bottomLabel', label: 'Etiqueta inferior', type: 'text' as const, defaultValue: 'Consectetur adipiscing elit' },
    { key: 'fontSize', label: 'Tamaño de texto', type: 'font-size' as const },
    { key: 'typographyStyle', label: 'Estilo', type: 'font-style' as const },
  ];
}
