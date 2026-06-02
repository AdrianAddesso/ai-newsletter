import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
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
} from '@mui/material'
import {
  Add as AddIcon,
  DeleteOutlined as DeleteIcon,
  EditOutlined as EditIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router'
import {
  deleteBrandKit,
  listBrandKits,
  type BrandKit,
} from '../../../api/brand-kits'
import { useNotification } from '../../../hooks/useNotification'
import { ModalDelete } from '../../ModalDelete'
import SearchBar from '../../SearchBar'

export function BrandkitList() {
  const navigate = useNavigate()
  const { error: notifyError, success } = useNotification()
  const [brandkits, setBrandkits] = useState<BrandKit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [orderBy, setOrderBy] = useState<keyof BrandKit>('name')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [limit, setLimit] = useState(5)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadBrandKits = useCallback(async (): Promise<void> => {
    setIsLoading(true)

    try {
      const response = await listBrandKits({ includeInactive: true })
      setBrandkits(response)
    } catch (loadError) {
      console.error('Error loading brand kits:', loadError)
      notifyError('No se pudieron obtener los brandkits.')
    } finally {
      setIsLoading(false)
    }
  }, [notifyError])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBrandKits()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadBrandKits])

  const filtered = useMemo(() => {
    return [...brandkits]
      .filter((brandKit) =>
        brandKit.name.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((left, right) => {
        const leftValue = String(left[orderBy] ?? '')
        const rightValue = String(right[orderBy] ?? '')

        if (leftValue === rightValue) {
          return 0
        }

        return (leftValue < rightValue ? -1 : 1) * (order === 'asc' ? 1 : -1)
      })
  }, [brandkits, order, orderBy, search])

  const handleSort = (property: keyof BrandKit): void => {
    const isAscending = orderBy === property && order === 'asc'
    setOrder(isAscending ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleDelete = async (): Promise<void> => {
    if (!deleteId) {
      return
    }

    try {
      await deleteBrandKit(deleteId)
      setBrandkits((current) => current.filter((brandKit) => brandKit.id !== deleteId))
      success('Brandkit eliminado correctamente.')
    } catch (deleteError) {
      console.error('Error deleting brand kit:', deleteError)
      notifyError('No se pudo eliminar el brandkit.')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h6">Brandkits</Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona las identidades visuales disponibles para los newsletters.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <SearchBar value={search} onChange={setSearch} />
          <Tooltip title="Actualizar lista">
            <IconButton size="small" onClick={() => void loadBrandKits()}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/brandkit')}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Nuevo Brandkit
          </Button>
        </Stack>
      </Stack>

      {isLoading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : filtered.length === 0 ? (
        <Alert severity="info">
          No hay brandkits que coincidan con la busqueda.
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
                    onClick={() => handleSort('name')}
                  >
                    Nombre
                  </TableSortLabel>
                </TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'created_at'}
                    direction={orderBy === 'created_at' ? order : 'asc'}
                    onClick={() => handleSort('created_at')}
                  >
                    Creado
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'updated_at'}
                    direction={orderBy === 'updated_at' ? order : 'asc'}
                    onClick={() => handleSort('updated_at')}
                  >
                    Actualizado
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.slice(0, limit).map((brandKit) => (
                <TableRow key={brandKit.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{brandKit.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={brandKit.active ? 'Activo' : 'Inactivo'}
                      size="small"
                      color={brandKit.active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(brandKit.created_at).toLocaleDateString('es-AR')}
                  </TableCell>
                  <TableCell>
                    {new Date(brandKit.updated_at).toLocaleDateString('es-AR')}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/admin/brandkit?id=${brandKit.id}`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Borrar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteId(brandKit.id)}
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

          {limit < filtered.length && (
            <Box
              sx={{
                p: 2,
                textAlign: 'center',
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Button onClick={() => setLimit((current) => current + 5)}>
                Cargar mas resultados
              </Button>
            </Box>
          )}
        </TableContainer>
      )}

      <ModalDelete
        open={Boolean(deleteId)}
        description="Esta accion eliminara el brandkit de forma permanente. Los recursos asociados quedaran fuera de uso."
        onClose={() => setDeleteId(null)}
        onConfirm={() => void handleDelete()}
      />
    </Stack>
  )
}
