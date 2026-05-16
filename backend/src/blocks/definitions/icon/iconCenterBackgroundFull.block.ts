import { BlockDefinition } from '../../block.definition';

export class IconCenterBackgroundFullBlock extends BlockDefinition {
  readonly type = 'iconCenterBackgroundFull' as const;
  readonly category = 'ICONS' as const;
  readonly label = 'Icono Centrado con Fondo';
  readonly description = 'Icono centrado con texto debajo y fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'asset1.jpg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}
