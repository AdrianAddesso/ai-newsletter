import { v4 as uuidv4 } from 'uuid';
import type { TemplateLayoutItem } from '../types/newsletter';
import type { RowObject, ColumnObject } from '../interfaces/interfaces.templates';
 
export const mapLayoutItemsToRows = (layoutItems: TemplateLayoutItem[]): RowObject[] => {
  if (!Array.isArray(layoutItems) || layoutItems.length === 0) return [];

  const rowMap = new Map<number, TemplateLayoutItem[]>();
  
  layoutItems.forEach(item => {
    if (!item || typeof item.row !== 'number') return;
    
    if (!rowMap.has(item.row)) {
      rowMap.set(item.row, []);
    }
    rowMap.get(item.row)!.push(item);
  });

  const sortedRows = Array.from(rowMap.keys()).sort((a, b) => a - b);

  return sortedRows.map((rowIndex, index) => {
    const itemsInRow = rowMap.get(rowIndex)!;
    itemsInRow.sort((a, b) => a.display_order - b.display_order);

    const maxDisplayOrder = Math.max(...itemsInRow.map(i => i.display_order), 0);
    const columns: ColumnObject[] = [];

    for (let colIndex = 0; colIndex <= maxDisplayOrder; colIndex++) {
      const item = itemsInRow.find(i => i.display_order === colIndex || i.grid_column === colIndex);

      if (item) {
        let parsedContent: string | null = null;
        if (item.content !== undefined && item.content !== null) {
          parsedContent = typeof item.content === 'string' 
            ? item.content 
            : JSON.stringify(item.content);
        }

        columns.push({
          id: uuidv4(),
          type: item.block_type,
          content: parsedContent,
          mustFill: false,
          displayOrder: colIndex,
        });
      } else {
        columns.push({
          id: uuidv4(),
          type: null,
          content: null,
          mustFill: false,
          displayOrder: colIndex,
        });
      }
    }

    return {
      id: uuidv4(),
      rowIndex: index, 
      columns
    };
  });
};
