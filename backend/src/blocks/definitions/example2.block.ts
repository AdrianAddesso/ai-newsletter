import { BlockDefinition } from '../block.definition';

export class Example2Block extends BlockDefinition {
  readonly type = 'BASE' as const;
  readonly label = 'Ejemplo 2';
  readonly description = 'Este es el bloque 2';
  readonly icon = 'text_fields';
  readonly previewKey = 'asset2.jpg';
  readonly mustFill = true;
  readonly layout = { minCols: 2, minRows: 1, resizable: true };
}
