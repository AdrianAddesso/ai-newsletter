import { useState, useMemo } from 'react'
import {
  Box, Container, Typography, Stack,
  Grid, MenuItem, Select, FormControl,
  InputLabel
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import { useNavigate } from 'react-router'
import { useTheme } from '@mui/material/styles'
import { TemplateCard } from '../components/TemplateCard'
import SearchBar from '../components/SearchBar'


// Cuando el backend esté listo, esto se reemplaza por una llamada a la API
const TEMPLATES = [
  { id: 'uuid-1', name: 'Verano 2024', area_id: 'Marketing', state_id: 'state_1', description: 'Recomendado para promociones y campañas estacionales.', orientation: 'Landscape' as const },
  { id: 'uuid-2', name: 'Newsletter IT', area_id: 'Tecnología', state_id: 'state_2', description: 'Recomendado para updates internos del área de tecnología.', orientation: 'Portrait' as const },
  { id: 'uuid-3', name: 'Black Friday', area_id: 'Ventas', state_id: 'state_3', description: 'Recomendado para campañas anuales de alto impacto.', orientation: 'Portrait' as const },
]

// Áreas únicas para el filtro
const AREAS = ['Todas', ...Array.from(new Set(TEMPLATES.map(t => t.area_id)))]
const ORIENTATIONS = ['Todas', 'Portrait', 'Landscape']

export function TemplateLibraryPage() {
  const theme = useTheme()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [areaFilter, setAreaFilter] = useState('Todas')
  const [orientationFilter, setOrientationFilter] = useState('Todas')

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchesSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      const matchesArea = areaFilter === 'Todas' || t.area_id === areaFilter
      const matchesOrientation = orientationFilter === 'Todas' || t.orientation === orientationFilter
      return matchesSearch && matchesArea && matchesOrientation
    })
    // Solo mostramos los publicados (state_1 y state_3)
    // a los usuarios normales
    .filter(t => t.state_id !== 'state_2')
  }, [search, areaFilter, orientationFilter])

  const handlePreview = (id: string) => {
    // Por ahora solo loguea, cuando esté lista la vista previa se navega
    console.log('Preview del template:', id)
  }

  const handleSelect = (id: string) => {
    // Al seleccionar navega al formulario de creación con el template elegido
    navigate(`/crearNewsletter?templateId=${id}`)
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
          <Stack spacing={1}>
            <Typography variant="h2">Biblioteca de Plantillas</Typography>
            <Typography variant="body1" color="text.secondary">
              Seleccioná el diseño ideal para tu próxima comunicación.
            </Typography>
          </Stack>

          {/* Filtros */}
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <SearchBar
              value={search}
              onChange={setSearch}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Área</InputLabel>
              <Select
                value={areaFilter}
                label="Área"
                onChange={(e: SelectChangeEvent) => setAreaFilter(e.target.value)}
              >
                {AREAS.map(area => (
                  <MenuItem key={area} value={area}>{area}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Orientación</InputLabel>
              <Select
                value={orientationFilter}
                label="Orientación"
                onChange={(e: SelectChangeEvent) => setOrientationFilter(e.target.value)}
              >
                {ORIENTATIONS.map(o => (
                  <MenuItem key={o} value={o}>{o}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* Grid de cards */}
          {filteredTemplates.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
              No se encontraron plantillas con esos filtros.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {filteredTemplates.map(template => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={template.id}>
                  <TemplateCard
                    {...template}
                    onPreview={handlePreview}
                    onSelect={handleSelect}
                  />
                </Grid>
              ))}
            </Grid>
          )}

        </Stack>
      </Container>
    </Box>
  )
}

export default TemplateLibraryPage