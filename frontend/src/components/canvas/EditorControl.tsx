import React, { useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Divider,
  Alert
} from '@mui/material';
import { useTemplateStore } from '../../stores/templates.store';
import { useBlockDefinitions } from '../../hooks/useBlockDefinitions';
import { getBlockPreviewUrl } from '../../utils/block.utils';
import { TYPE_LABELS } from '../../utils/constants';

export const EditorControl: React.FC = () => {
  const { selectedBlockId, rows, updateColumnBlock } = useTemplateStore();

  const { data: definitions } = useBlockDefinitions();

  const groupedDefinitions = useMemo(() => {
    if (!definitions) return {};

    return definitions.reduce((acc, block) => {
      
      const type = block.type;
      
      if (!acc[type]) acc[type] = [];
      
      acc[type].push(block);
      
      return acc;

    }, {} as Record<string, typeof definitions>);

  }, [definitions]);

  const result = useMemo(() => {
    return rows.map(row => ({ row, col: row.columns.find(c => c.id === selectedBlockId) })).find(({ col }) => col);
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
      <Stack spacing={1}>
        <Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 1.5,
            }}
          >
          </Box>
        </Box>
        {Object.entries(groupedDefinitions).map(([type, blocks]) => (
          <Box key={type}>
            <Typography variant="caption" sx={{ mb: 1.5, display: 'block', fontWeight: 600, color: 'text.secondary' }}>
              {TYPE_LABELS[type] || type}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 1.5,
              }}
            >
              {blocks?.map((block) => {
                const isSelected = selectedCol.type === block.type;
                return (
                  <Box
                    key={block.type}
                    onClick={() => selectedRow && updateColumnBlock(selectedRow.id, selectedCol.id, block)}
                    sx={{
                      aspectRatio: '1/1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      bgcolor: isSelected ? 'primary.50' : 'background.paper',
                      '&:hover': {
                        borderColor: 'primary.light',
                        bgcolor: 'action.hover'
                      },
                      transition: 'all 0.2s ease-in-out',
                      p: 1
                    }}
                  >
                    <Box
                      component="img"
                      src={getBlockPreviewUrl(block.previewKey)}
                      sx={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '50%',
                        objectFit: "contain",
                        mb: 0.5
                      }}
                    />
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
        ))}
      </Stack>
      <Divider />
      {!selectedCol.type && (
        <Alert severity="info">Asigna un bloque a la columna seleccionada.</Alert>
      )}
    </Stack>
  );
};
