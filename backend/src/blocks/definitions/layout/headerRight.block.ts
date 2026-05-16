import { BlockDefinition } from '../../block.definition';

export class HeaderRightBlock extends BlockDefinition {
  readonly type = 'headerRight' as const;
  readonly category = 'LAYOUT' as const;
  readonly label = 'Header Solo Derecha';
  readonly description = 'Esta es la cabecera con el logo a la derecha';
  readonly icon = 'text_fields';
  readonly previewKey = 'asset1.jpg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}
