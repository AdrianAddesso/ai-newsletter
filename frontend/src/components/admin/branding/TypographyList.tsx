import { useRef, useState, type ChangeEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  DeleteOutlined as DeleteIcon,
  EditOutlined as EditIcon,
  UploadFile as UploadIcon,
} from '@mui/icons-material'
import type { BrandKitFont } from '../../../api/brand-kits'
import { ModalDelete } from '../../ModalDelete'

export type FontEntry = BrandKitFont

type FontStyleColor = 'default' | 'primary' | 'secondary' | 'info'

const styleColors: Record<string, FontStyleColor> = {
  Regular: 'default',
  Bold: 'primary',
  Italic: 'secondary',
  'Bold Italic': 'info',
}

const formatBytes = (bytes: number | null): string => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

interface FontDialogProps {
  open: boolean
  font: FontEntry | null
  onClose: () => void
  onConfirm: (fontId: string, data: { name: string; style: string }) => Promise<void>
  isSubmitting: boolean
}

function FontDialog({
  open,
  font,
  onClose,
  onConfirm,
  isSubmitting,
}: FontDialogProps) {
  const [name, setName] = useState(font?.name ?? '')
  const [style, setStyle] = useState(font?.style ?? 'Regular')

  const isValid = name.trim() !== '' && style.trim() !== ''

  const handleSubmit = async (): Promise<void> => {
    if (!font || !isValid) {
      return
    }

    await onConfirm(font.id, {
      name: name.trim(),
      style: style.trim(),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Editar fuente</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Nombre
            </Typography>
            <Box
              component="input"
              value={name}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setName(event.target.value)
              }
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
          <Box>
            <Typography variant="caption" color="text.secondary">
              Estilo
            </Typography>
            <Box
              component="input"
              value={style}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setStyle(event.target.value)
              }
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
          Guardar cambios
        </Button>
      </DialogActions>
    </Dialog>
  )
}

interface TypographyListProps {
  fonts: FontEntry[]
  isLoading?: boolean
  isDisabled?: boolean
  onUploadFonts: (files: File[]) => Promise<void>
  onUpdateFont: (fontId: string, data: { name: string; style: string }) => Promise<void>
  onDeleteFont: (fontId: string) => Promise<void>
}

export function TypographyList({
  fonts,
  isLoading = false,
  isDisabled = false,
  onUploadFonts,
  onUpdateFont,
  onDeleteFont,
}: TypographyListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<FontEntry | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList | null): Promise<void> => {
    if (!files?.length) {
      return
    }

    setIsSubmitting(true)

    try {
      await onUploadFonts(Array.from(files))
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
      await onDeleteFont(deleteId)
      setDeleteId(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (
    fontId: string,
    data: { name: string; style: string },
  ): Promise<void> => {
    setIsSubmitting(true)

    try {
      await onUpdateFont(fontId, data)
      setEditTarget(null)
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
              <Typography variant="subtitle1">Tipografias</Typography>
              <Typography variant="body2" color="text.secondary">
                Carga y administra los archivos de fuentes del brandkit.
              </Typography>
            </Stack>

            <Box>
              <input
                ref={fileInputRef}
                type="file"
                accept=".woff,.woff2,.otf,.ttf,.eot"
                multiple
                hidden
                onChange={(event) => {
                  void handleFileUpload(event.target.files)
                  event.target.value = ''
                }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<UploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isDisabled || isLoading || isSubmitting}
              >
                Subir fuente
              </Button>
            </Box>
          </Stack>

          {isDisabled ? (
            <Alert severity="info">
              Guarda el brandkit primero para poder administrar sus tipografias.
            </Alert>
          ) : (
            <Box
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                void handleFileUpload(event.dataTransfer.files)
              }}
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
                textAlign: 'center',
                color: 'text.secondary',
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Typography variant="caption">
                Tambien puedes arrastrar archivos de fuentes aqui
              </Typography>
            </Box>
          )}

          {isLoading ? (
            <Alert severity="info">Cargando tipografias del brandkit...</Alert>
          ) : isDisabled ? null : fonts.length === 0 ? (
            <Alert severity="info">Aun no hay fuentes cargadas.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Estilo</TableCell>
                    <TableCell>Archivo</TableCell>
                    <TableCell>Tamano</TableCell>
                    <TableCell>Cargado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fonts.map((font) => (
                    <TableRow key={font.id} hover>
                      <TableCell>
                        <Typography variant="body2">{font.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={font.style}
                          size="small"
                          color={styleColors[font.style] ?? 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {font.file_name}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatBytes(font.size_bytes)}</TableCell>
                      <TableCell>
                        {new Date(font.created_at).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => setEditTarget(font)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Quitar fuente">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteId(font.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </CardContent>

      <FontDialog
        key={editTarget?.id ?? 'closed'}
        open={Boolean(editTarget)}
        font={editTarget}
        onClose={() => setEditTarget(null)}
        onConfirm={handleUpdate}
        isSubmitting={isSubmitting}
      />

      <ModalDelete
        open={Boolean(deleteId)}
        description="Esta accion eliminara la fuente del brandkit."
        onClose={() => setDeleteId(null)}
        onConfirm={() => void handleDelete()}
      />
    </Card>
  )
}
