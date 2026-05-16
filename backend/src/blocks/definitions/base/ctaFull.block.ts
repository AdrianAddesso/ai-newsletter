import { BlockDefinition } from '../../block.definition';

export class CTAFullBlock extends BlockDefinition {
  readonly type = 'BASE' as const;
  readonly label = 'CTA Principal';
  readonly description = 'Call to Action principal';
  readonly icon = 'text_fields';
  readonly previewKey = 'asset1.jpg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}