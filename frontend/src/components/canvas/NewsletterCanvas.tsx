import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNewsletterStore } from '../../stores/templates.store';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { constants } from '../../utils/constants';

const MOCK_REGISTRY: Record<string, { type: string; label: string; content: string }> = {
  'content-1': { type: 'CONTENT', label: 'Mockup 1', content: 'Bienvenidos a nuestra newsletter semanal.' },
  'image-1': { type: 'MULTIMEDIA', label: 'Mockup 2', content: 'Imagen de cabecera' },
  'content-2': { type: 'CONTENT', label: 'Mockup 3', content: 'Gracias por leernos.' },
};

export const NewsletterCanvas: React.FC = () => {
  const { rows, isSkeletonView, selectedBlockId, setSelectedBlockId } = useNewsletterStore();

  const renderBlock = (col: { type: string | null; id: string }) => {
    const block = MOCK_REGISTRY[col.type || ''];
    if (!block) {
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          minHeight: '100px',
          color: 'text.disabled',
          border: isSkeletonView ? 'none' : '1px dashed #ccc'
        }}>
          <Typography variant="caption">Vacío</Typography>
        </Box>
      );
    }
    return (
      <Box sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: block.type === 'MULTIMEDIA' ? '#F5F5F5' : 'transparent',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {block.type === 'MULTIMEDIA' && (
          <ImageOutlinedIcon sx={{ color: '#bbb', fontSize: 32}} />
        )}
        <Typography 
          variant={block.type === 'CONTENT' ? 'body2' : 'caption'}
          color={block.type === 'CONTENT' ? 'text.primary' : 'text.disabled'}
          sx={{ 
            width: '100%',
            textAlign: 'center',
            wordBreak: 'break-word',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {block.content}
        </Typography>
      </Box>
    );
  };
  return (
    <Box sx={{
      maxWidth: constants.BASE_WIDTH,
      width: '100%',
      margin: "0 auto",
      bgcolor: 'white',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
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
            const isSelected = selectedBlockId === col.id;
            const n_columns = row.columns.length;

            
            return (
              <Box
                key={col.id}
                onClick={() => setSelectedBlockId(col.id)}
                sx={{
                  minHeight: '100px',
                  flex: `1 0 calc(100% / ${n_columns})`,
                  maxWidth: `calc(100% / ${n_columns})`,
                  position: 'relative',
                  cursor: 'pointer',
                  border: isSkeletonView ? '1px dashed #ccc' : 'none',
                  outline: isSelected ? '2px solid #FF595A' : 'none',
                  outlineOffset: '-2px',
                  zIndex: isSelected ? 2 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    bgcolor: isSkeletonView ? 'rgba(0,0,0,0.02)' : 'transparent'
                  }
                }}
              >
                <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                  {isSkeletonView ? (
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
                        COL {col.displayOrder + 1}
                      </Typography>
                      {col.type && (
                        <Typography variant="caption" color="primary" sx={{ fontSize: '0.65rem' }}>
                          {MOCK_REGISTRY[col.type]?.label || 'Asignado'}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    renderBlock(col)
                  )}
                </Box>
                {isSelected && (
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bgcolor: '#FF595A',
                    color: 'white',
                    fontSize: '10px',
                    px: 0.5,
                    fontWeight: 700
                  }}>
                    SELECCIONADO
                  </Box>
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
