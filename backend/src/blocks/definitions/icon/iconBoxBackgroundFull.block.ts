import { BlockDefinition } from '../../block.definition';

export class IconBoxBackgroundFullBlock extends BlockDefinition {
  readonly type = 'iconBoxBackgroundFull' as const;
  readonly category = 'ICONS' as const;
  readonly label = 'Iconos multiples con fondo';
  readonly description = 'Este es el bloque de multiples iconos con fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'IconBoxBackgroundFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
  readonly editFields = [
    { key: 'iconName', label: 'Nombre del icono (Material)', type: 'text' as const, placeholder: 'description', required: true, defaultValue: 'description' },
    { key: 'iconAsset', label: 'Icono', type: 'image-asset' as const, assetTypes: ['ICON', 'IMAGE'] as const },
    { key: 'label', label: 'Etiqueta', type: 'text' as const, defaultValue: 'Lorem ipsum dolor sit amet consectetur.' },
    { key: 'item1Text', label: 'Texto del icono 1', type: 'text' as const, defaultValue: 'Lorem ipsum dolor sit amet consectetur.' },
    { key: 'item2Text', label: 'Texto del icono 2', type: 'text' as const, defaultValue: 'Adipiscing elit provident blanditiis.' },
    { key: 'item3Text', label: 'Texto del icono 3', type: 'text' as const, defaultValue: 'Natus ratione necessitatibus consequuntur.' },
    { key: 'item4Text', label: 'Texto del icono 4', type: 'text' as const, defaultValue: 'Eum voluptas iure repellat voluptate.' },
    { key: 'bgColor', label: 'Color de fondo', type: 'color' as const },
    { key: 'backgroundAsset', label: 'Fondo', type: 'image-asset' as const, assetTypes: ['IMAGE', 'SHAPE', 'KEYWORD'] as const },
    { key: 'fontSize', label: 'Tamano de texto', type: 'font-size' as const },
    { key: 'typographyStyle', label: 'Estilo', type: 'font-style' as const },
    { key: 'fontFamily', label: 'Tipografia', type: 'font-family' as const },
    { key: 'href', label: 'URL de destino', type: 'url' as const, placeholder: 'https://' },
  ];
}
