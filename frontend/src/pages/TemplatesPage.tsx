import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
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
  TableSortLabel,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import {
  Add as AddIcon,
  CheckCircleOutlined as ReviewIcon,
  DeleteOutlined as DeleteIcon,
  EditOutlined as EditIcon,
  VisibilityOutlined as ViewIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router'
import { deleteTemplate, listTemplates } from '../api/templates'
import { ModalDelete } from '../components/ModalDelete'
import { TemplateCreator } from '../components/canvas/TemplateCreator'
import { mapLayoutItemsToRows } from '../utils/canvas.utils'
import SearchBar from '../components/SearchBar'
import { useAuth } from '../contexts/AuthContext'
import type { NewsletterTemplate } from '../types/newsletter'
import type { UserRole } from '../users/types/users'
import { areaLabels } from '../utils/newsletterTemplates'

type StatusChipColor = 'default' | 'success' | 'warning'

const STATE_COLOR_MAP: Record<string, StatusChipColor> = {
  ACTIVE: 'success',
  DRAFT: 'warning',
}

type TemplateTableRow = NewsletterTemplate & {
  area_id: NewsletterTemplate['area']
  state_id: string
  state_name: string
  created_at: string
}

const canDeleteTemplate = (role: UserRole | undefined): boolean =>
  role === 'ADMIN' || role === 'FUNCTIONAL'

export function TemplatesPage() {
  const { user } = useAuth()
  const theme = useTheme()
  const navigate = useNavigate()
  const role = user?.role

  const [templates, setTemplates] = useState<TemplateTableRow[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [templatesError, setTemplatesError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [orderBy, setOrderBy] = useState<keyof TemplateTableRow>('name')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [limit, setLimit] = useState(5)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<TemplateTableRow | null>(null)

  useEffect(() => {
    let mounted = true

    const loadTemplates = async () => {
      setIsLoadingTemplates(true)
      setTemplatesError(null)

      try {
        const data = await listTemplates()

        if (!mounted) {
          return
        }

        setTemplates(
          data.map((template) => ({
            ...template,
            area_id: template.area,
            state_id: template.stateCode,
            state_name: template.stateName,
            created_at: template.createdAt,
          })),
        )
      } catch {
        if (mounted) {
          setTemplates([])
          setTemplatesError('No se pudieron obtener las plantillas disponibles.')
        }
      } finally {
        if (mounted) {
          setIsLoadingTemplates(false)
        }
      }
    }

    void loadTemplates()

    return () => {
      mounted = false
    }
  }, [])

  const filteredTemplates = useMemo(() => {
    return [...templates]
      .filter((template) =>
        [
          template.name,
          template.description ?? '',
          template.area_id,
          template.state_name,
          template.created_at,
        ].some((value) =>
          value.toLowerCase().includes(search.toLowerCase()),
        ),
      )
      .sort((left, right) => {
        const leftValue = String(left[orderBy] ?? '')
        const rightValue = String(right[orderBy] ?? '')

        if (leftValue === rightValue) {
          return 0
        }

        const result = leftValue < rightValue ? -1 : 1
        return order === 'asc' ? result : -result
      })
  }, [templates, search, order, orderBy])

  const previewRows = useMemo(() => {
    if (!previewTemplate?.layout) {
      return []
    }

    return mapLayoutItemsToRows(previewTemplate.layout)
  }, [previewTemplate])

  const handleRequestSort = (property: keyof TemplateTableRow) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) {
      return
    }

    setIsDeleting(true)
    setTemplatesError(null)

    try {
      await deleteTemplate(deleteId)
      setTemplates((current) => current.filter((template) => template.id !== deleteId))
      setDeleteId(null)
    } catch {
      setTemplatesError('No se pudo eliminar la plantilla en este momento.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoadingTemplates) {
    return (
      <Box
        sx={{
          py: theme.nestle?.page?.sectionPaddingY || 4,
          px: theme.nestle?.page?.sectionPaddingX || 2,
          bgcolor: 'background.default',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        py: theme.nestle?.page?.sectionPaddingY || 4,
        px: theme.nestle?.page?.sectionPaddingX || 2,
        bgcolor: 'background.default',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Stack spacing={4}>
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', alignItems: 'flex-end' }}
          >
            <Stack spacing={1}>
              <Typography variant="h2">Templates</Typography>
              <Typography variant="body1" color="text.secondary">
                Gestiona y optimiza tus diseños de newsletters.
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <SearchBar value={search} onChange={setSearch} />

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/templates/create')}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Nuevo Template
              </Button>
            </Stack>
          </Stack>

          {templatesError && <Alert severity="error">{templatesError}</Alert>}

          {!templatesError && templates.length === 0 ? (
            <Alert severity="info">
              No hay plantillas disponibles en este momento.
            </Alert>
          ) : (
            <TableContainer component={Card} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'name'}
                        direction={orderBy === 'name' ? order : 'asc'}
                        onClick={() => handleRequestSort('name')}
                      >
                        Título
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Área</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'created_at'}
                        direction={orderBy === 'created_at' ? order : 'asc'}
                        onClick={() => handleRequestSort('created_at')}
                      >
                        Creado
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTemplates.slice(0, limit).map((template) => (
                    <TableRow key={template.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{template.name}</Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{ maxWidth: 200, display: 'block' }}
                        >
                          {template.description}
                        </Typography>
                      </TableCell>
                      <TableCell>{areaLabels[template.area_id]}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={template.state_name}
                          color={STATE_COLOR_MAP[template.state_id] ?? 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(template.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{ justifyContent: 'flex-end' }}
                        >
                          <Tooltip title="Vista previa">
                            <IconButton size="small" onClick={() => setPreviewTemplate(template)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {(role === 'ADMIN' || role === 'FUNCTIONAL') && (
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/templates/edit/${template.id}`)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {canDeleteTemplate(role) && (
                            <Tooltip title="Borrar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteId(template.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {role === 'FUNCTIONAL' && template.state_id !== 'DRAFT' && (
                            <Button size="small" startIcon={<ReviewIcon />} variant="outlined">
                              Revisar
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {limit < filteredTemplates.length && (
                <Box
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Button onClick={() => setLimit((current) => current + 5)}>
                    Cargar más resultados
                  </Button>
                </Box>
              )}
            </TableContainer>
          )}
        </Stack>
      </Container>

      <Dialog
        open={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{previewTemplate?.name ?? 'Vista previa'}</DialogTitle>
        <DialogContent dividers sx={{ bgcolor: 'grey.100' }}>
          {previewRows.length > 0 ? (
            <TemplateCreator mode="readonly" rows={previewRows} />
          ) : (
            <Alert severity="info">
              Este template no tiene bloques configurados para previsualizar.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewTemplate(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <ModalDelete
        open={Boolean(deleteId)}
        description="Esta acción eliminará el template de forma permanente. No podrás recuperar la configuración del prompt base."
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />
    </Box>
  )
}

export default TemplatesPage
