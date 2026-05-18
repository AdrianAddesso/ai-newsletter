import { BlockDefinition } from '../../block.definition';

export class IconRightBackgroundFullBlock extends BlockDefinition {
  readonly type = 'iconRightBackgroundFull' as const;
  readonly category = 'ICONS' as const;
  readonly label = 'Icono Derecha con Fondo';
  readonly description = 'Icono alineado a la derecha con texto y fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'IconRightBackgroundFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}
