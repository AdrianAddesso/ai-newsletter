import { BlockDefinition } from '../../block.definition';

export class IconRightBackgroundFullBlock extends BlockDefinition {
  readonly type = 'iconRightBackgroundFull' as const;
  readonly category = 'ICONS' as const;
  readonly label = 'Icono Derecha con Fondo';
  readonly description = 'Icono alineado a la derecha con texto y fondo';
  readonly icon = 'text_fields';
  readonly previewKey = 'IconRightBackgroundFullRenderer.svg';
  readonly mustFill = true;
  readonly layout = { minCols: 1, minRows: 1, resizable: true };
  readonly editFields = [
    { key: 'iconName', label: 'Nombre del ícono (Material)', type: 'text' as const, placeholder: 'description', required: true, defaultValue: 'description' },
    { key: 'label', label: 'Etiqueta', type: 'text' as const, defaultValue: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { key: 'fontSize', label: 'Tamaño de texto', type: 'font-size' as const },
    { key: 'typographyStyle', label: 'Estilo', type: 'font-style' as const },
  ];
}
