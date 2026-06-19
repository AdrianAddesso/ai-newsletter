import { BlockDefinition } from '../../block.definition';

export class LabelLeftBackgroundFullBlock extends BlockDefinition {
  readonly type = 'labelLeftBackgroundFull' as const;
  readonly category = 'CONTENT' as const;
  readonly label = 'Etiqueta Izquierda con Fondo';
  readonly description = 'Etiqueta destacada alineada a la izquierda con fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'LabelLeftBackgroundFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
  readonly editFields = [
    { key: 'label', label: 'Etiqueta', type: 'text' as const, required: true, defaultValue: 'Lorem ipsum dolor sit amet' },
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
