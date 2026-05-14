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
import { useTemplateStore } from '../../stores/templates.store';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import { CropLandscape, CropPortrait } from '@mui/icons-material';

export const StructureControl: React.FC<{ onConfirm: () => void }> = ({ onConfirm }) => {
  const { layoutMode, setMode, rows, addRow, removeRow, addColumn, removeColumn } = useTemplateStore();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
          Orientación
        </Typography>
        <ToggleButtonGroup
          value={layoutMode}
          exclusive
          onChange={(_, val) => val && setMode(val)}
          fullWidth
          size="small"
        >
          <ToggleButton value="PORTRAIT">
            <CropPortrait sx={{ mr: 1 }} /> PORTRAIT (Max 4)
          </ToggleButton>
          <ToggleButton value="LANDSCAPE">
            <CropLandscape sx={{ mr: 1 }} /> LANDSCAPE (Max 8)
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Divider />
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
        Configuración
      </Typography>
      <Box>
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
                Fila {index + 1} | {row.columns.length} {row.columns.length > 1 ? 'columnas' : 'columna'}
              </Typography>
              <Stack direction="row" sx={{ spacing: '0.5', alignItems: 'center'}}>
                <IconButton
                  size="small"
                  onClick={() => removeColumn(row.id)}
                  disabled={row.columns.length <= 1}
                  title="Quitar columna"
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => addColumn(row.id)}
                  disabled={row.columns.length >= (layoutMode === 'PORTRAIT' ? 4 : 8)}
                  title="Añadir columna"
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 16, alignSelf: 'center' }} />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => removeRow(row.id)}
                  title="Eliminar fila"
                >
                  <DeleteIcon fontSize="small" />
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
      <Box>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<AddIcon />}
          onClick={addRow}
        >
          Añadir Fila
        </Button>
      </Box>
      <Divider />
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
