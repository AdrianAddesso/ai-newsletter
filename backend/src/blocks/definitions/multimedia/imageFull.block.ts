import { BlockDefinition } from '../../block.definition';

export class ImageFullBlock extends BlockDefinition {
  readonly type = 'imageFull' as const;
  readonly category = 'MULTIMEDIA' as const;
  readonly label = 'Imagen Completa';
  readonly description = 'Imagen a ancho completo sin fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'asset1.jpg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}
