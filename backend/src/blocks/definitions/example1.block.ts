import { BlockDefinition } from '../block.definition';

export class Example1Block extends BlockDefinition {
  readonly type = 'LAYOUT' as const;
  readonly label = 'Ejemplo 1';
  readonly description = 'Este es el bloque 1';
  readonly icon = 'text_fields';
  readonly previewKey = 'asset1.jpg';
  readonly mustFill = true;
  readonly layout = { minCols: 2, minRows: 1, resizable: true };
}