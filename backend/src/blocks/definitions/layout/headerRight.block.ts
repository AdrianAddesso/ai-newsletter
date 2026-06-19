import { BlockDefinition } from '../../block.definition';

export class HeaderRightBlock extends BlockDefinition {
  readonly type = 'headerRight' as const;
  readonly category = 'LAYOUT' as const;
  readonly label = 'Header Solo Derecha';
  readonly description = 'Esta es la cabecera con el logo a la derecha';
  readonly icon = 'text_fields';
  readonly previewKey = 'HeaderRightRenderer.svg';
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
