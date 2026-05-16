import { BlockDefinition } from '../../block.definition';

export class SpecialBoxBackgroundFullBlock extends BlockDefinition {
  readonly type = 'specialBoxBackgroundFull' as const;
  readonly category = 'SPECIAL' as const;
  readonly label = 'Bloque Especial con Fondo';
  readonly description = 'Bloque de tres columnas con etiqueta, textos e imagen con fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'asset1.jpg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}
