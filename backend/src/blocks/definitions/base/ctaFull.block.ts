import { BlockDefinition } from '../../block.definition';

export class CTAFullBlock extends BlockDefinition {
  readonly type = 'ctaFull' as const;
  readonly category = 'BASE' as const;
  readonly label = 'CTA Principal';
  readonly description = 'Call to Action principal';
  readonly icon = 'text_fields';
  readonly previewKey = 'CTAFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
  readonly editFields = [
    { key: 'buttonLabel', label: 'Texto del botón', type: 'text' as const, placeholder: 'Click here', required: true, defaultValue: 'Click here' },
    { key: 'fontSize', label: 'Tamaño de texto', type: 'font-size' as const },
    { key: 'typographyStyle', label: 'Estilo', type: 'font-style' as const },
    { key: 'fontFamily', label: 'Tipografía', type: 'font-family' as const },
    { key: 'fontColor', label: 'Color de texto', type: 'font-color' as const },
    { key: 'href', label: 'URL de destino', type: 'url' as const, placeholder: 'https://' },
    { key: 'bgColor', label: 'Color de Fondo del Botón', type: 'color' as const },
    { key: 'blockBgColor', label: 'Color de Fondo', type: 'color' as const },
  ];
}
