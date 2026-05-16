import { BlockDefinition } from '../../block.definition';

export class ImageBackgroundFullBlock extends BlockDefinition {
  readonly type = 'imageBackgroundFull' as const;
  readonly category = 'MULTIMEDIA' as const;
  readonly label = 'Imagen con Fondo';
  readonly description = 'Imagen centrada al 80% con fondo visible';
  readonly icon = 'text_fields';
  readonly previewKey = 'asset1.jpg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}
