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
  readonly editFields = [
    { key: 'title', label: 'TÃ­tulo', type: 'text' as const, required: true },
    { key: 'subtitle', label: 'SubtÃ­tulo', type: 'text' as const },
    { key: 'bgColor', label: 'Color de fondo', type: 'color' as const },
    { key: 'logoAsset', label: 'Logo', type: 'image-asset' as const, assetTypes: ['LOGO', 'LOCKUP'] as const },
    { key: 'fontSize', label: 'TamaÃ±o de texto', type: 'font-size' as const },
    { key: 'typographyStyle', label: 'Estilo', type: 'font-style' as const },
    { key: 'fontFamily', label: 'TipografÃ­a', type: 'font-family' as const },
    { key: 'fontColor', label: 'Color de texto', type: 'font-color' as const },
    { key: 'href', label: 'URL de destino', type: 'url' as const, placeholder: 'https://' },
  ];
}
