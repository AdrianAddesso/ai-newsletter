import { BlockDefinition } from '../../block.definition';

export class CTAAlternativeBlock extends BlockDefinition {
  readonly type = 'ctaAlternative' as const;
  readonly category = 'BASE' as const;
  readonly label = 'CTA Alternativa';
  readonly description = 'Call to Action alternativo';
  readonly icon = 'text_fields';
  readonly previewKey = 'CTAAlternativeRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
}
