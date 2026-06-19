import { BlockDefinition } from '../../block.definition';

export class IconLeftBackgroundFullBlock extends BlockDefinition {
  readonly type = 'iconLeftBackgroundFull' as const;
  readonly category = 'ICONS' as const;
  readonly label = 'Icono Izquierda con Fondo';
  readonly description = 'Icono alineado a la izquierda con texto y fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'IconLeftBackgroundFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
  readonly editFields = [
    { key: 'iconName', label: 'Nombre del ícono (Material)', type: 'text' as const, placeholder: 'description', required: true, defaultValue: 'description' },
    { key: 'iconAsset', label: 'Ícono', type: 'image-asset' as const, assetTypes: ['ICON', 'IMAGE'] as const },
    { key: 'label', label: 'Etiqueta', type: 'text' as const, defaultValue: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { key: 'bgColor', label: 'Color de fondo', type: 'color' as const },
    { key: 'backgroundAsset', label: 'Fondo', type: 'image-asset' as const, assetTypes: ['IMAGE', 'SHAPE', 'KEYWORD'] as const },
    { key: 'fontSize', label: 'Tamaño de texto', type: 'font-size' as const },
    { key: 'typographyStyle', label: 'Estilo', type: 'font-style' as const },
    { key: 'fontFamily', label: 'Tipografía', type: 'font-family' as const },
    { key: 'fontColor', label: 'Color de texto', type: 'font-color' as const },
    { key: 'href', label: 'URL de destino', type: 'url' as const, placeholder: 'https://' },
  ];
}
