import React from 'react';
import { 
  Box, 
  Button, 
  Stack, 
  Typography, 
  ToggleButtonGroup, 
  ToggleButton, 
  Divider,
  IconButton
} from '@mui/material';
import { useNewsletterStore } from '../../stores/templates.store';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';

export const StructureControl: React.FC<{ onConfirm: () => void }> = ({ onConfirm }) => {
  const { 
    layoutMode, 
    setMode, 
    rows, 
    addRow, 
    removeRow, 
    addColumn, 
    removeColumn 
  } = useNewsletterStore();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
          MODO DE DISEÑO
        </Typography>
        <ToggleButtonGroup
          value={layoutMode}
          exclusive
          onChange={(_, val) => val && setMode(val)}
          fullWidth
          size="small"
        >
          <ToggleButton value="PORTRAIT">
            <ViewStreamIcon sx={{ mr: 1 }} /> PORTRAIT (Max 4)
          </ToggleButton>
          <ToggleButton value="LANDSCAPE">
            <ViewWeekIcon sx={{ mr: 1 }} /> LANDSCAPE (Max 8)
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Divider />
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
          GESTIÓN DE FILAS
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            fullWidth 
            startIcon={<AddIcon />} 
            onClick={addRow}
          >
            Añadir Fila
          </Button>
          <Button 
            variant="outlined" 
            fullWidth 
            color="error" 
            startIcon={<RemoveIcon />} 
            onClick={() => rows.length > 0 && removeRow(rows[rows.length - 1].id)}
            disabled={rows.length === 0}
          >
            Quitar Última
          </Button>
        </Stack>
      </Box>
      <Divider />
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
          COLUMNAS POR FILA
        </Typography>
        <Stack spacing={1}>
          {rows.map((row, index) => (
            <Box 
              key={row.id} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                p: 1,
                bgcolor: 'grey.50',
                borderRadius: 1
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Fila {index + 1} ({row.columns.length} col)
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton 
                  size="small" 
                  onClick={() => removeColumn(row.id)}
                  disabled={row.columns.length <= 1}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="primary"
                  onClick={() => addColumn(row.id)}
                  disabled={row.columns.length >= (layoutMode === 'PORTRAIT' ? 4 : 8)}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          ))}
          {rows.length === 0 && (
            <Typography variant="caption" color="text.disabled">
              No hay filas definidas.
            </Typography>
          )}
        </Stack>
      </Box>
      <Button 
        variant="contained" 
        fullWidth 
        size="large" 
        onClick={onConfirm}
        disabled={rows.length === 0}
        sx={{ mt: 2, bgcolor: 'brand.red', '&:hover': { bgcolor: '#e04040' } }}
      >
        Confirmar Estructura
      </Button>
    </Stack>
  );
};
