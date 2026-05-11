import React, { useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  Divider,
  Alert
} from '@mui/material';
import { useNewsletterStore } from '../../stores/templates.store';

const AVAILABLE_BLOCKS = [
  { id: 'content-1', type: 'CONTENT', label: 'Mockup 1' },
  { id: 'image-1', type: 'MULTIMEDIA', label: 'Mockup 2' },
  { id: 'content-2', type: 'CONTENT', label: 'Mockup 3' },
  { id: 'content-3', type: 'CONTENT', label: 'Mockup 4' },
  { id: 'content-4', type: 'CONTENT', label: 'Mockup 5' },
];

export const EditorControl: React.FC = () => {
  const { selectedBlockId, rows, updateColumnBlock } = useNewsletterStore();

  const result = useMemo(() => {
    return rows.map(row => ({row, col: row.columns.find(c => c.id === selectedBlockId)}))
      .find(({ col }) => col);
  }, [rows, selectedBlockId]);

  const selectedRow = result?.row ?? null;
  const selectedCol = result?.col ?? null;

  if (!selectedBlockId || !selectedCol) {
    return (
      <Box sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        py: 6,
        color: 'text.disabled'
      }}>
        <Typography variant="body2">Seleccioná un bloque en la grilla para editar</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        EDITAR BLOQUE
      </Typography>
      <Box>
        <Typography variant="caption" sx={{ mb: 1.5, display: 'block', fontWeight: 600, color: 'text.secondary' }}>
          TIPO DE BLOQUE (REGISTRY)
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 1.5,
          }}
        >
          <Box
            onClick={() => selectedRow && updateColumnBlock(selectedRow.id, selectedCol.id, '')}
            sx={{
              aspectRatio: '1/1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid',
              borderColor: !selectedCol.type ? 'primary.main' : 'divider',
              borderRadius: 1,
              cursor: 'pointer',
              bgcolor: !selectedCol.type ? 'primary.50' : 'background.paper',
              '&:hover': {
                borderColor: 'primary.light',
                bgcolor: 'action.hover'
              },
              transition: 'all 0.2s ease-in-out',
              p: 1
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, color: !selectedCol.type ? 'primary.main' : 'text.secondary' }}>
              Ninguno
            </Typography>
          </Box>
          {AVAILABLE_BLOCKS.map((block) => {
            const isSelected = selectedCol.type === block.id;
            return (
              <Box
                key={block.id}
                onClick={() => selectedRow && updateColumnBlock(selectedRow.id, selectedCol.id, block.id)}
                sx={{
                  aspectRatio: '1/1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  p: 1,
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: isSelected ? 'primary.50' : 'background.paper',
                  '&:hover': {
                    borderColor: 'primary.light',
                    bgcolor: 'action.hover'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    width: '100%',
                    bgcolor: 'grey.100',
                    borderRadius: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed',
                    borderColor: 'grey.300'
                  }}
                >
                  <Typography variant="overline" sx={{ fontSize: '0.6rem', lineHeight: 1, color: 'text.disabled' }}>
                    {block.type}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                    color: isSelected ? 'primary.main' : 'text.primary'
                  }}
                >
                  {block.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
      <Divider />
      {selectedCol.type ? (
        <Stack spacing={2}>
          <TextField
            label=" "
            multiline
            rows={4}
            fullWidth
            placeholder="El contenido real se gestionará vinculando el block_content_id..."
            disabled
          />
        </Stack>
      ) : (
        <Alert severity="info">Asigna un tipo de bloque del Registry para editar su contenido.</Alert>
      )}
    </Stack>
  );
};
