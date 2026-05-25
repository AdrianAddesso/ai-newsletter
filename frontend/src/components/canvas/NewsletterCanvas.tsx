import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { BlockRenderer } from '../blocks/BlockRenderer';
import { CONSTANTS_CANVAS } from '@shared/enums/templates-canvas'
import { useBlockDefinitions } from '../../hooks/useBlockDefinitions';
import type { RowObject, ColumnObject } from '../../interfaces/interfaces.templates';

export interface NewsletterCanvasProps {
  mode: 'readonly' | 'edit';
  rows: RowObject[];
  isSkeletonView?: boolean;
  selectedBlockId?: string | null;
  onBlockSelect?: (id: string | null) => void;
  onBlockDelete?: (rowId: string, columnId: string) => void;
}

export const NewsletterCanvas: React.FC<NewsletterCanvasProps> = ({
  mode,
  rows,
  isSkeletonView = false,
  selectedBlockId = null,
  onBlockSelect,
  onBlockDelete
}) => {
  const { data: definitions } = useBlockDefinitions();

  const isEditMode = mode === 'edit';

  const renderBlock = (col: ColumnObject, rowIndex: number) => {
    return <BlockRenderer block={col} rowIndex={rowIndex} />;
  };

  return (
    <Box sx={{
      maxWidth: CONSTANTS_CANVAS.BASE_WIDTH,
      width: '100%',
      margin: "0 auto",
      bgcolor: 'white',
      boxShadow: 'none',
      overflow: 'hidden',
      '& *': { boxSizing: 'border-box' }
    }}>
      {rows.map((row) => (
        <Box 
          key={row.id} 
          sx={{ 
            display: 'flex', 
            width: '100%',
          }}
        >
          {row.columns.map((col) => {
            const isSelected = isEditMode && selectedBlockId === col.id;
            const n_columns = row.columns.length;
            const blockDef = definitions?.find(d => d.type === col.type);
            return (
              <Box
                key={col.id}
                onClick={() => {
                  if (isEditMode && onBlockSelect) {
                    onBlockSelect(col.id);
                  }
                }}
                sx={{
                  minHeight: '100px',
                  flex: `1 0 calc(100% / ${n_columns})`,
                  maxWidth: `calc(100% / ${n_columns})`,
                  position: 'relative',
                  cursor: isEditMode ? 'pointer' : 'default',
                  border: isEditMode && isSkeletonView ? '1px dashed #ccc' : 'none',
                  outline: isSelected ? '2px solid #FF595A' : 'none',
                  outlineOffset: '-2px',
                  zIndex: isSelected ? 2 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    bgcolor: isEditMode && isSkeletonView ? 'rgba(0,0,0,0.02)' : 'transparent'
                  }
                }}
              >
                <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                  {isEditMode && isSkeletonView ? (
                    <Box sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.5,
                      p: 1
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                        FILA {row.rowIndex + 1} | COLUMNA {col.displayOrder + 1}
                      </Typography>
                      {col.type && (
                        <Typography variant="caption" color="primary" sx={{ fontSize: '0.65rem' }}>
                          {blockDef?.label || col.type}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    renderBlock(col, row.rowIndex)
                  )}
                </Box>
                {isSelected && (
                  <>
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bgcolor: '#FF595A',
                      color: 'white',
                      fontSize: '10px',
                      px: 0.5,
                      fontWeight: 700,
                      zIndex: 3
                    }}>
                      SELECCIONADO
                    </Box>
                    {!isSkeletonView && col.type && onBlockDelete && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBlockDelete(row.id, col.id);
                        }}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'white',
                          color: 'error.main',
                          boxShadow: "none",
                          zIndex: 3,
                          '&:hover': {
                            bgcolor: 'error.lighter',
                          },
                          width: 24,
                          height: 24,
                          p: 0.5
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16}} />
                      </IconButton>
                    )}
                  </>
                )}
              </Box>
            );
          })}
        </Box>
      ))}
      {rows.length === 0 && (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>
          <Typography>Añade filas desde el panel de control para empezar.</Typography>
        </Box>
      )}
    </Box>
  );
};
