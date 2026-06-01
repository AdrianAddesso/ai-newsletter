import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { CONSTANTS_CANVAS } from '@shared/enums/templates-canvas'
import { type TemplateState } from '../interfaces/interfaces.templates';
import type { BlockDefinitionDTO } from '../../../packages/shared/src/types/block.types';
import type { TemplateMutationResponse } from '../../../packages/shared/src/types/template.types';
import axios from 'axios';

interface TemplateStore extends TemplateState {
  setMode: (mode: 'PORTRAIT' | 'LANDSCAPE') => void;
  setIsSkeletonView: (isSkeleton: boolean) => void;
  setSelectedBlockId: (id: string | null) => void;

  setTemplateDetails: (name?: string, description?: string, promptBase?: string, area?: string) => void;

  addRow: () => void;
  removeRow: (rowId: string) => void;

  addColumn: (rowId: string) => void;
  removeColumn: (rowId: string) => void;

  updateColumnBlock: (rowId: string, columnId: string, definition: BlockDefinitionDTO | null) => void;

  resetStore: (initialData?: Partial<TemplateState>) => void;

  saveTemplate: (templateId?: string) => Promise<TemplateMutationResponse>;

  buildTemplateToSave: () => {
    name: string;
    description: string;
    promptBase: string;
    state: string;
    orientation: 'PORTRAIT' | 'LANDSCAPE';
    area: string;
    layout: {
      block_type: string | null;
      content: string | null;
      row: number;
      grid_column: number;
      display_order: number;
    }[];
  }
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
    name: '',
    description: '',
      promptBase: '',
      layoutMode: 'PORTRAIT',
      area: '',
      state: 'ACTIVE',
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
      const maxCols = CONSTANTS_CANVAS.COLUMN_LIMITS[mode];
      const updatedRows = rows.map(row => ({
        ...row,
        columns: row.columns.slice(0, maxCols)
      }));
      set({ layoutMode: mode, rows: updatedRows });
    },

    setTemplateDetails: (name, description, promptBase, area) => set(state => ({
      name: name !== undefined ? name : state.name,
      description: description !== undefined ? description : state.description,
      promptBase: promptBase !== undefined ? promptBase : state.promptBase,
      area: area !== undefined ? area : state.area
    })),

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
      const maxCols = CONSTANTS_CANVAS.COLUMN_LIMITS[state.layoutMode];
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
      layoutMode: 'PORTRAIT',
      isSkeletonView: true,
      name: '',
      description: '',
      promptBase: '',
      area: '',
      state: 'ACTIVE',
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

    saveTemplate: async (templateId) => {
      const templateData = get().buildTemplateToSave();
      const res = templateId
        ? await axios.patch(`/templates/${templateId}`, templateData)
        : await axios.post('/templates', templateData);

      return res.data;
    },

    buildTemplateToSave: () => {
      const { name, description, promptBase, layoutMode, area, rows, state } = get();
      const layout = rows.flatMap(row =>
        row.columns.map(col => ({
          block_type: col.type,
          content: col.content,
          row: row.rowIndex,
          grid_column: col.displayOrder,
          display_order: col.displayOrder
        }))
      );

      return {
        name,
        description,
        promptBase,
        orientation: layoutMode,
        area,
        state,
        layout
      };
    }
}));
