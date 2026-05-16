import { BlockDefinition } from '../../block.definition';

export class IconLeftBackgroundFullBlock extends BlockDefinition {
  readonly type = 'ICONS' as const;
  readonly label = 'Icono Izquierda con Fondo';
  readonly description = 'Icono alineado a la izquierda con texto y fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'asset1.jpg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}