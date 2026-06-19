import { BlockDefinition } from '../../block.definition';

export class EmptyBlock extends BlockDefinition {
  readonly type = 'empty' as const;
  readonly category = 'BASE' as const;
  readonly label = 'Bloque vacío';
  readonly description = 'Un bloque sin contenido';
  readonly icon = 'text_fields';
  readonly previewKey = 'EmptyRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
  readonly editFields = [
    { key: 'bgColor', label: 'Color de fondo', type: 'color' as const },
    { key: 'href', label: 'URL de destino', type: 'url' as const, placeholder: 'https://' },
  ];
}
