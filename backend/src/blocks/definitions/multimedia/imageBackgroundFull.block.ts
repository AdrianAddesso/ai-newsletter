import { BlockDefinition } from '../../block.definition';

export class ImageBackgroundFullBlock extends BlockDefinition {
  readonly type = 'imageBackgroundFull' as const;
  readonly category = 'MULTIMEDIA' as const;
  readonly label = 'Imagen con Fondo';
  readonly description = 'Imagen centrada al 80% con fondo visible';
  readonly icon = 'text_fields';
  readonly previewKey = 'ImageBackgroundFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
  readonly editFields = [
    { key: 'backgroundAsset', label: 'Fondo', type: 'image-asset' as const, assetTypes: ['IMAGE', 'SHAPE', 'KEYWORD'] },
    { key: 'imageAsset', label: 'Imagen', type: 'image-asset' as const, required: true, assetTypes: ['IMAGE'] },
    { key: 'altText', label: 'Texto alternativo', type: 'text' as const, defaultValue: 'Image' },
    { key: 'overlayColor', label: 'Color de overlay', type: 'color' as const },
  ];
}
