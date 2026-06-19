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
    { key: 'bgColor', label: 'Color de las Etiquetas', type: 'color' as const },
    { key: 'backgroundColor', label: 'Color de fondo', type: 'color' as const },
    { key: 'backgroundAsset', label: 'Fondo', type: 'image-asset' as const, assetTypes: ['IMAGE', 'SHAPE', 'KEYWORD'] as const },
    { key: 'fontSize', label: 'Tamaño de texto', type: 'font-size' as const },
    { key: 'typographyStyle', label: 'Estilo', type: 'font-style' as const },
    { key: 'fontFamily', label: 'Tipografía', type: 'font-family' as const },
    { key: 'fontColor', label: 'Color de texto', type: 'font-color' as const },
    { key: 'href', label: 'URL de destino', type: 'url' as const, placeholder: 'https://' },
  ];
}
