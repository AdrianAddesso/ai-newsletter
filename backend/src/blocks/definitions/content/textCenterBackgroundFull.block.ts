import { BlockDefinition } from '../../block.definition';

export class TextCenterBackgroundFullBlock extends BlockDefinition {
  readonly type = 'textCenterBackgroundFull' as const;
  readonly category = 'CONTENT' as const;
  readonly label = 'Texto Centrado con Fondo';
  readonly description = 'Texto centrado horizontalmente con fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'TextCenterBackgroundFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
  readonly editFields = [
    { key: 'text', label: 'Texto', type: 'textarea' as const, required: true, defaultValue: 'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.' },
    { key: 'bgColor', label: 'Color de fondo', type: 'color' as const },
    { key: 'backgroundAsset', label: 'Fondo', type: 'image-asset' as const, assetTypes: ['IMAGE', 'SHAPE', 'KEYWORD'] as const },
    { key: 'fontSize', label: 'Tamaño de texto', type: 'font-size' as const },
    { key: 'typographyStyle', label: 'Estilo', type: 'font-style' as const },
    { key: 'fontFamily', label: 'Tipografía', type: 'font-family' as const },
  ];
}
