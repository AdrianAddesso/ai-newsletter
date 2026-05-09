import { useState, useMemo } from 'react'
import {
  Box, Button, Card, Chip, Container, Stack, Typography, useTheme,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip,
  TableSortLabel
} from '@mui/material'
import {
  DeleteOutlined as DeleteIcon,
  EditOutlined as EditIcon,
  VisibilityOutlined as ViewIcon,
  FileDownloadOutlined as ExportIcon,
  CheckCircleOutlined as ReviewIcon,
  Add as AddIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { ModalDelete } from '../components/ModalDelete'
import SearchBar from '../components/SearchBar'

type StatusChipColor = 'default' | 'success' | 'warning'

const STATE_MAP: Record<string, { label: string; color: StatusChipColor }> = {
  'state_1': { label: 'Publicado', color: 'success' },
  'state_2': { label: 'En borrador', color: 'warning' },
  'state_3': { label: 'Publicado', color: 'success' },
}

export function TemplatesPage() {
  const { user } = useAuth()
  const theme = useTheme()
  const navigate = useNavigate()
  const role = user?.role ?? 'USER'

  const [search, setSearch] = useState('')
  const [orderBy, setOrderBy] = useState('name')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [limit, setLimit] = useState(5)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [templates] = useState([
    { id: 'uuid-1', name: 'Verano 2024', area_id: 'Marketing', state_id: 'state_1', created_at: '2024-01-15T10:00:00Z', description: 'Promo de verano' },
    { id: 'uuid-2', name: 'Newsletter IT', area_id: 'Tecnología', state_id: 'state_2', created_at: '2024-02-10T14:30:00Z', description: 'Updates internos' },
    { id: 'uuid-3', name: 'Black Friday', area_id: 'Ventas', state_id: 'state_3', created_at: '2023-11-20T09:00:00Z', description: 'Campaña anual' },
  ])

  const filteredTemplates = useMemo(() => {
    return templates
      .filter(t =>
        Object.values(t).some(value =>
          value?.toString().toLowerCase().includes(search.toLowerCase())
        )
      )
      .sort((a, b) => {
        const isAsc = order === 'asc'
        return (a[orderBy as keyof typeof a] < b[orderBy as keyof typeof b] ? -1 : 1) * (isAsc ? 1 : -1)
      })
  }, [templates, search, order, orderBy])

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleConfirmDelete = () => {
    console.log('Eliminando:', deleteId)
    setDeleteId(null)
  }

  return (
    <Box sx={{
      py: theme.nestle?.page?.sectionPaddingY || 4,
      px: theme.nestle?.page?.sectionPaddingX || 2,
      bgcolor: 'background.default',
      minHeight: '100vh'
    }}>
      <Container maxWidth="lg" disableGutters>
        <Stack spacing={4}>
          {/* Header */}
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-end" }}>
            <Stack spacing={1}>
              <Typography variant="h2">Templates</Typography>
              <Typography variant="body1" color="text.secondary">
                Gestiona y optimiza tus diseños de newsletters.
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <SearchBar
                value={search}
                onChange={setSearch}
              />

              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => navigate('#')}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Nuevo Template
              </Button>
            </Stack>
          </Stack>

          {/* Tabla */}
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
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                        {template.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{template.area_id}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={STATE_MAP[template.state_id]?.label}
                        color={STATE_MAP[template.state_id]?.color ?? 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(template.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                        
                        <Tooltip title="Vista Previa">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`#`)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {(role === 'ADMIN') && (
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => navigate(`/editarTemplate/${template.id}`)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {role === 'ADMIN' && (
                          <>
                            <Tooltip title="Exportar">
                              <IconButton size="small" color="primary"><ExportIcon fontSize="small" /></IconButton>
                            </Tooltip>
                            <Tooltip title="Borrar">
                              <IconButton size="small" color="error" onClick={() => setDeleteId(template.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}

                        {role === 'FUNCTIONAL' && template.state_id !== 'state_2' && (
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
              <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={() => setLimit(limit + 5)}>
                  Cargar más resultados
                </Button>
              </Box>
            )}
          </TableContainer>
        </Stack>
      </Container>

      <ModalDelete
        open={Boolean(deleteId)}
        description="Esta acción eliminará el template de forma permanente. No podrás recuperar la configuración del prompt base."
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  )
}

export default TemplatesPage
