import { useState, type ChangeEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Add as AddIcon,
  DeleteOutlined as DeleteIcon,
  EditOutlined as EditIcon,
} from '@mui/icons-material'
import type { BrandKitResourceColor } from '../../../api/brand-kits'
import { ModalDelete } from '../../ModalDelete'

export type Color = BrandKitResourceColor

interface ColorDialogProps {
  open: boolean
  color?: Color | null
  onClose: () => void
  onConfirm: (data: Pick<Color, 'name' | 'hex'>) => Promise<void>
  isSubmitting: boolean
}

function ColorDialog({
  open,
  color,
  onClose,
  onConfirm,
  isSubmitting,
}: ColorDialogProps) {
  const [name, setName] = useState(color?.name ?? '')
  const [hex, setHex] = useState(color?.hex ?? '#000000')

  const isValid = name.trim() !== '' && /^#[0-9A-Fa-f]{6}$/.test(hex)

  const handleSubmit = async (): Promise<void> => {
    if (!isValid) {
      return
    }

    await onConfirm({ name: name.trim(), hex: hex.toUpperCase() })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{color ? 'Editar color' : 'Nuevo color'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Box
              component="input"
              type="color"
              value={hex}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setHex(event.target.value)
              }
              sx={{
                width: 48,
                height: 48,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                cursor: 'pointer',
                padding: '2px',
                bgcolor: 'transparent',
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Codigo HEX
              </Typography>
              <Box
                component="input"
                value={hex}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setHex(event.target.value)
                }
                placeholder="#FF0000"
                sx={{
                  width: '100%',
                  mt: 0.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor:
                    hex !== '' && !/^#[0-9A-Fa-f]{6}$/.test(hex)
                      ? 'error.main'
                      : 'divider',
                }}
              />
              {hex !== '' && !/^#[0-9A-Fa-f]{6}$/.test(hex) ? (
                <Typography variant="caption" color="error">
                  Formato invalido. Usa #RRGGBB
                </Typography>
              ) : null}
            </Box>
          </Stack>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Nombre del color
            </Typography>
            <Box
              component="input"
              value={name}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setName(event.target.value)
              }
              placeholder="ej: Rojo Corporativo"
              sx={{
                width: '100%',
                mt: 0.5,
                px: 1.5,
                py: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={!isValid || isSubmitting}
        >
          {color ? 'Guardar cambios' : 'Agregar color'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

interface ColorListProps {
  colors: Color[]
  isLoading?: boolean
  isDisabled?: boolean
  onCreateColor: (data: Pick<Color, 'name' | 'hex'>) => Promise<void>
  onUpdateColor: (colorId: string, data: Pick<Color, 'name' | 'hex'>) => Promise<void>
  onDeleteColor: (colorId: string) => Promise<void>
}

export function ColorList({
  colors,
  isLoading = false,
  isDisabled = false,
  onCreateColor,
  onUpdateColor,
  onDeleteColor,
}: ColorListProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Color | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openAdd = (): void => {
    setEditTarget(null)
    setDialogOpen(true)
  }

  const openEdit = (color: Color): void => {
    setEditTarget(color)
    setDialogOpen(true)
  }

  const handleDialogClose = (): void => {
    if (isSubmitting) {
      return
    }

    setDialogOpen(false)
    setEditTarget(null)
  }

  const handleConfirm = async (data: Pick<Color, 'name' | 'hex'>): Promise<void> => {
    setIsSubmitting(true)

    try {
      if (editTarget) {
        await onUpdateColor(editTarget.id, data)
      } else {
        await onCreateColor(data)
      }

      setDialogOpen(false)
      setEditTarget(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (!deleteId) {
      return
    }

    setIsSubmitting(true)

    try {
      await onDeleteColor(deleteId)
      setDeleteId(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Stack spacing={3}>
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Stack spacing={0.5}>
              <Typography variant="subtitle1">Paleta de colores</Typography>
              <Typography variant="body2" color="text.secondary">
                Define los colores corporativos de este brandkit.
              </Typography>
            </Stack>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={openAdd}
              disabled={isDisabled || isLoading}
            >
              Agregar color
            </Button>
          </Stack>

          {isDisabled ? (
            <Alert severity="info">
              Guarda el brandkit primero para poder administrar sus colores.
            </Alert>
          ) : isLoading ? (
            <Alert severity="info">Cargando colores del brandkit...</Alert>
          ) : colors.length === 0 ? (
            <Alert severity="info">Aun no hay colores definidos.</Alert>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              }}
            >
              {colors.map((color) => (
                <Box
                  key={color.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: 56,
                      bgcolor: color.hex,
                      border:
                        color.hex.toUpperCase() === '#FFFFFF'
                          ? '1px solid'
                          : 'none',
                      borderColor: 'divider',
                    }}
                  />
                  <Stack
                    direction="row"
                    sx={{
                      px: 1,
                      py: 0.5,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Stack spacing={0}>
                      <Typography variant="caption" noWrap>
                        {color.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}
                      >
                        {color.hex.toUpperCase()}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0}>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => openEdit(color)}>
                          <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Borrar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteId(color.id)}
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Box>
          )}
        </Stack>
      </CardContent>

      <ColorDialog
        key={editTarget?.id ?? (dialogOpen ? 'new' : 'closed')}
        open={dialogOpen}
        color={editTarget}
        onClose={handleDialogClose}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting}
      />

      <ModalDelete
        open={Boolean(deleteId)}
        description="Esta accion eliminara el color de forma permanente."
        onClose={() => setDeleteId(null)}
        onConfirm={() => void handleDelete()}
      />
    </Card>
  )
}
