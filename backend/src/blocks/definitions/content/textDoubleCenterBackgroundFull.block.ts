import { BlockDefinition } from '../../block.definition';

export class TextDoubleCenterBackgroundFullBlock extends BlockDefinition {
  readonly type = 'textDoubleCenterBackgroundFull' as const;
  readonly category = 'CONTENT' as const;
  readonly label = 'Doble Texto Centrado con Fondo';
  readonly description = 'Dos bloques de texto centrados con fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'TextDoubleCenterBackgroundFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
  readonly editFields = [
    { key: 'primaryText', label: 'Texto principal', type: 'textarea' as const, required: true, defaultValue: 'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.' },
    { key: 'secondaryText', label: 'Texto secundario', type: 'textarea' as const, defaultValue: 'Consequuntur eum voluptas iure repellat voluptate, nisi ipsam explicabo fugit architecto sint adipisci.' },
    { key: 'bgColor', label: 'Color de fondo', type: 'color' as const },
    { key: 'backgroundAsset', label: 'Fondo', type: 'image-asset' as const, assetTypes: ['IMAGE', 'SHAPE', 'KEYWORD'] as const },
    { key: 'fontSize', label: 'TamaÃ±o de texto', type: 'font-size' as const },
    { key: 'typographyStyle', label: 'Estilo', type: 'font-style' as const },
    { key: 'fontFamily', label: 'TipografÃ­a', type: 'font-family' as const },
    { key: 'fontColor', label: 'Color de texto', type: 'font-color' as const },
    { key: 'href', label: 'URL de destino', type: 'url' as const, placeholder: 'https://' },
  ];
}
