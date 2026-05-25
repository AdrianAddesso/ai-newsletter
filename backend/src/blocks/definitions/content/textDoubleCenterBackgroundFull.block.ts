import { BlockDefinition } from '../../block.definition';

export class TextDoubleCenterBackgroundFullBlock extends BlockDefinition {
  readonly type = 'textDoubleCenterBackgroundFull' as const;
  readonly category = 'CONTENT' as const;
  readonly label = 'Doble Texto Centrado con Fondo';
  readonly description = 'Dos bloques de texto centrados con fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'TextDoubleCenterBackgroundFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
  readonly editFields = [
    { key: 'primaryText', label: 'Texto principal', type: 'textarea' as const, required: true },
    { key: 'secondaryText', label: 'Texto secundario', type: 'textarea' as const },
    { key: 'bgColor', label: 'Color de fondo', type: 'color' as const },
    { key: 'fontSize', label: 'Tamaño de texto', type: 'font-size' as const },
    { key: 'typographyStyle', label: 'Estilo', type: 'font-style' as const },
  ];
}
