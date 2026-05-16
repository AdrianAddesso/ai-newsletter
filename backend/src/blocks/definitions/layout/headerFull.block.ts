import { BlockDefinition } from '../../block.definition';

export class HeaderFullBlock extends BlockDefinition {
  readonly type = 'LAYOUT' as const;
  readonly label = 'Header Principal';
  readonly description = 'Esta es la cabecera principal';
  readonly icon = 'text_fields';
  readonly previewKey = 'asset1.jpg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}