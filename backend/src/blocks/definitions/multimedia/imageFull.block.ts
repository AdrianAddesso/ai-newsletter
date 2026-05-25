import { BlockDefinition } from '../../block.definition';

export class ImageFullBlock extends BlockDefinition {
  readonly type = 'imageFull' as const;
  readonly category = 'MULTIMEDIA' as const;
  readonly label = 'Imagen Completa';
  readonly description = 'Imagen a ancho completo sin fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'ImageFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
  readonly editFields = [
    { key: 'imageUrl', label: 'URL de imagen', type: 'image-url' as const, required: true, defaultValue: 'https://placehold.net/4.png' },
    { key: 'altText', label: 'Texto alternativo', type: 'text' as const, defaultValue: 'Full image' },
  ];
}
