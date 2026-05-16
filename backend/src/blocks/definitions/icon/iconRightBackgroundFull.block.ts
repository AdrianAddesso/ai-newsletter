import { BlockDefinition } from '../../block.definition';

export class IconRightBackgroundFullBlock extends BlockDefinition {
  readonly type = 'ICONS' as const;
  readonly label = 'Icono Derecha con Fondo';
  readonly description = 'Icono alineado a la derecha con texto y fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'asset1.jpg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}