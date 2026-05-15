import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { constants } from '../utils/constants';
import { type TemplateState } from '../interfaces/interfaces.templates';
import type { BlockDefinitionDTO } from '../../../packages/shared/src/types/block.types';

interface TemplateStore extends TemplateState {
  setMode: (mode: 'PORTRAIT' | 'LANDSCAPE') => void;
  setIsSkeletonView: (isSkeleton: boolean) => void;
  setSelectedBlockId: (id: string | null) => void;

  addRow: () => void;
  removeRow: (rowId: string) => void;

  addColumn: (rowId: string) => void;
  removeColumn: (rowId: string) => void;

  updateColumnBlock: (rowId: string, columnId: string, definition: BlockDefinitionDTO | null) => void;

  resetStore: (initialData?: Partial<TemplateState>) => void;

  saveTemplate: () => Promise<void>;
}


export const useTemplateStore = create<TemplateStore>((set, get) => ({
  id: uuidv4(),
  title: 'Nuevo Template',
  layoutMode: 'PORTRAIT',
  isSkeletonView: true,
  rows: [
    {
      id: uuidv4(),
      rowIndex: 0,
      columns: [{ id: uuidv4(), type: null, content: null, mustFill: false, displayOrder: 0 }]
    }
  ],
  selectedBlockId: null,

  setMode: (mode) => {
    const { rows } = get();
    const maxCols = constants.COLUMN_LIMITS[mode];
    const updatedRows = rows.map(row => ({
      ...row,
      columns: row.columns.slice(0, maxCols)
    }));
    set({ layoutMode: mode, rows: updatedRows });
  },

  setIsSkeletonView: (isSkeleton) => set({ isSkeletonView: isSkeleton }),

  setSelectedBlockId: (id) => set({ selectedBlockId: id }),

  addRow: () => set((state) => ({
    rows: [
      ...state.rows,
      {
        id: uuidv4(),
        rowIndex: state.rows.length,
        columns: [{ id: uuidv4(), type: null, content: null, mustFill: false, displayOrder: 0 }]
      }
    ]
  })),

  removeRow: (rowId) => set((state) => ({
    rows: state.rows.filter(r => r.id !== rowId).map((r, i) => ({ ...r, rowIndex: i }))
  })),

  addColumn: (rowId) => set((state) => {
    const maxCols = constants.COLUMN_LIMITS[state.layoutMode];
    return {
      rows: state.rows.map(row => {
        if (row.id === rowId && row.columns.length < maxCols) {
          return {
            ...row,
            columns: [
              ...row.columns,
              { id: uuidv4(), type: null, content: null, mustFill: false, displayOrder: row.columns.length }
            ]
          };
        }
        return row;
      })
    };
  }),

  removeColumn: (rowId) => set((state) => ({
    rows: state.rows.map(row => {
      if (row.id === rowId && row.columns.length > 1) {
        return {
          ...row,
          columns: row.columns.slice(0, -1)
        };
      }
      return row;
    })
  })),

  updateColumnBlock: (rowId, columnId, definition) => set((state) => ({
    rows: state.rows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          columns: row.columns.map(col =>
            col.id === columnId
              ? {
                ...col,
                type: definition?.type ?? null,
                content: definition?.defaultContent ?? null,
                mustFill: definition?.mustFill ?? false
              }
              : col
          )
        };
      }
      return row;
    })
  })),

  resetStore: (initialData) => set({
    id: uuidv4(),
    title: 'Nuevo Template',
    layoutMode: 'PORTRAIT',
    isSkeletonView: true,
    rows: [
      {
        id: uuidv4(),
        rowIndex: 0,
        columns: [{ id: uuidv4(), type: null, content: null, mustFill: false, displayOrder: 0 }]
      }
    ],
    selectedBlockId: null,
    ...initialData
  }),

  saveTemplate: async () => {
    const { id, rows } = get();
    const blocksToSave = rows.flatMap((row, rowIndex) =>
      row.columns.map((col, colIndex) => ({
        newsletter_id: id,
        block_type: col.type,
        content: col.content,
        row: rowIndex,
        grid_column: colIndex,
        display_order: col.displayOrder
      }))
    );
    // Aquí iría la lógica para enviar `blocksToSave` a la API
    console.log('Enviando a API:', blocksToSave);
  }
}));

