import React from 'react';
import {
  Box,
  Button,
  Stack,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useTemplateStore } from '../../stores/templates.store';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import { CropLandscape, CropPortrait } from '@mui/icons-material';
import { AreaName, AreaNameLabel } from '../../../../packages/shared/src/enums/area-name.enum';
import { enumToOptions } from '../../../../packages/shared/src/utils/enum-to-options';

export const StructureControl: React.FC<{ onConfirm: () => void }> = ({ onConfirm }) => {
  const { layoutMode, setMode, rows, addRow, removeRow, addColumn, removeColumn, setTemplateDetails, name, description, promptBase, area } = useTemplateStore();

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
        <Stack spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Nombre"
            fullWidth
            size="small"
            required
            error={name.length > 0 && (name.length < 3 || name.length > 140)}
            helperText={(name.length > 0 && (name.length < 3 || name.length > 140)) ? "Debe tener entre 3 y 140 caracteres" : ""}
            value={name}
            onChange={(e) => setTemplateDetails(e.target.value)}
          />
          <TextField
            label="Descripción"
            fullWidth
            size="small"
            required
            error={description.length > 0 && (description.length < 5 || description.length > 200)}
            helperText={(description.length > 0 && (description.length < 5 || description.length > 200)) ? "Debe tener entre 5 y 200 caracteres" : ""}
            value={description}
            onChange={(e) => setTemplateDetails(undefined, e.target.value, undefined)}
          />
          <TextField
            label="Prompt Base"
            fullWidth
            size="small"
            multiline
            rows={3}
            error={promptBase.length > 0 && (promptBase.length < 10 || promptBase.length > 500)}
            helperText={(promptBase.length > 0 && (promptBase.length < 10 || promptBase.length > 500)) ? "Debe tener entre 10 y 500 caracteres" : ""}
            value={promptBase}
            onChange={(e) => setTemplateDetails(undefined, undefined, e.target.value)}
          />
          <FormControl size="small" fullWidth required error={area.length === 0}>
            <InputLabel>Area</InputLabel>
            <Select
              value={area}
              label="Area"
              onChange={(e) => setTemplateDetails(undefined, undefined, undefined, e.target.value)}
            >
              {enumToOptions(AreaName, AreaNameLabel).map(({ value, label }) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
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
              <Stack direction="row" sx={{ spacing: '0.5', alignItems: 'center' }}>
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
          sx={{ maxWidth: '50%', alignSelf: 'center', marginLeft: '25%' }}
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
        disabled={
          name.length < 3 || name.length > 50 ||
          description.length < 5 || description.length > 200 ||
          area.length === 0
        }
        sx={{ maxWidth: '50%', mt: 2, bgcolor: 'brand.red', '&:hover': { bgcolor: '#e04040' }, alignSelf: 'center' }}
      >
        Confirmar Estructura
      </Button>
    </Stack>
  );
};
