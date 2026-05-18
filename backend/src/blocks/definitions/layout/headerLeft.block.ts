import { BlockDefinition } from '../../block.definition';

export class HeaderLeftBlock extends BlockDefinition {
  readonly type = 'headerLeft' as const;
  readonly category = 'LAYOUT' as const;
  readonly label = 'Header Solo Izquierda';
  readonly description = 'Esta es la cabecera con el logo a la izquierda';
  readonly icon = 'text_fields';
  readonly previewKey = 'HeaderLeftRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}
