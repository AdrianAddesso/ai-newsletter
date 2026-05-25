import { BlockDefinition } from '../../block.definition';

export class SpecialBoxBackgroundFullBlock extends BlockDefinition {
  readonly type = 'specialBoxBackgroundFull' as const;
  readonly category = 'SPECIAL' as const;
  readonly label = 'Bloque Especial con Fondo';
  readonly description = 'Bloque de tres columnas con etiqueta, textos e imagen con fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'SpecialBoxBackgroundFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
  readonly editFields = [
    { key: 'title', label: 'Título', type: 'text' as const, required: true, defaultValue: 'Lorem ipsum sit' },
    { key: 'introText', label: 'Texto superior', type: 'textarea' as const, defaultValue: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { key: 'bodyText', label: 'Texto central', type: 'textarea' as const, defaultValue: 'Provident blanditiis omnis natus ratione necessitatibus.' },
    { key: 'closingText', label: 'Texto inferior', type: 'textarea' as const, defaultValue: 'Consequuntur eum voluptas iure repellat voluptate nisi.' },
    { key: 'bgColor', label: 'Color de fondo', type: 'color' as const },
    { key: 'backgroundAsset', label: 'Fondo', type: 'image-asset' as const, assetTypes: ['IMAGE', 'SHAPE', 'KEYWORD'] },
    { key: 'imageAsset', label: 'Imagen', type: 'image-asset' as const, assetTypes: ['IMAGE'] },
    { key: 'fontSize', label: 'Tamaño de texto', type: 'font-size' as const },
    { key: 'typographyStyle', label: 'Estilo', type: 'font-style' as const },
    { key: 'fontFamily', label: 'Tipografía', type: 'font-family' as const },
  ];
}
