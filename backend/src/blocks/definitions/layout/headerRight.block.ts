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
    { key: 'title', label: 'Título', type: 'text' as const, required: true },
    { key: 'subtitle', label: 'Subtítulo', type: 'text' as const },
    { key: 'logoAsset', label: 'Logo', type: 'image-asset' as const, assetTypes: ['LOGO', 'LOCKUP'] },
    { key: 'fontSize', label: 'Tamaño de texto', type: 'font-size' as const },
    { key: 'typographyStyle', label: 'Estilo', type: 'font-style' as const },
    { key: 'fontFamily', label: 'Tipografía', type: 'font-family' as const },
  ];
}
