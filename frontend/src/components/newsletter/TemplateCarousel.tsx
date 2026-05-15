import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { areaLabels, getTemplatePreviewImage } from '../../utils/newsletterTemplates'
import type { AreaName, NewsletterTemplate } from '../../types/newsletter'
import { listBrandKits } from '../../api/brand-kits'

type Props = {
  templates: NewsletterTemplate[]
  selectedBrandKitId: string
  onSelectTemplate: (templateId: string) => void
  onSelectBrandKit: (brandKitId: string) => void
}

export function TemplateCarousel({
  templates,
  selectedBrandKitId,
  onSelectTemplate,
  onSelectBrandKit,
}: Props) {
  const [selectedArea, setSelectedArea] = useState<AreaName>('COMUNICACION_INTERNA')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [brandKitOptions, setBrandKitOptions] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    let mounted = true

    const loadBrandKits = async () => {
      try {
        const kits = await listBrandKits()
        if (mounted) {
          setBrandKitOptions(kits)
        }
      } catch {
        if (mounted) {
          setBrandKitOptions([])
        }
      }
    }

    void loadBrandKits()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedBrandKitId && brandKitOptions[0]?.id) {
      onSelectBrandKit(brandKitOptions[0].id)
    }
  }, [brandKitOptions, onSelectBrandKit, selectedBrandKitId])

  const effectiveArea = templates.some((template) => template.area === selectedArea)
    ? selectedArea
    : (templates[0]?.area ?? 'COMUNICACION_INTERNA')

  const filtered = templates.filter((template) => template.area === effectiveArea)
  const selected = filtered[selectedIndex] ?? filtered[0]
  const selectedBrandKitName =
    brandKitOptions.find((brandKit) => brandKit.id === selectedBrandKitId)?.name ?? selectedBrandKitId

  useEffect(() => {
    if (selected) onSelectTemplate(selected.id)
  }, [onSelectTemplate, selected])

  const prev = () => setSelectedIndex((i) => (i === 0 ? filtered.length - 1 : i - 1))
  const next = () => setSelectedIndex((i) => (i === filtered.length - 1 ? 0 : i + 1))

  const onAreaChange = (e: SelectChangeEvent<AreaName>) => {
    setSelectedArea(e.target.value as AreaName)
    setSelectedIndex(0)
  }

  const onBrandKitChange = (e: SelectChangeEvent<string>) => {
    onSelectBrandKit(e.target.value)
    setSelectedIndex(0)
  }

  return (
    <Stack spacing={2}>
      <Stack spacing={1.5}>
        <Typography variant="h5">Elegir plantilla</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="area-label">Area</InputLabel>
            <Select labelId="area-label" label="Area" value={effectiveArea} onChange={onAreaChange}>
              {Object.entries(areaLabels).map(([v, l]) => (
                <MenuItem key={v} value={v}>{l}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel id="brandkit-label">BrandKit</InputLabel>
            <Select labelId="brandkit-label" label="BrandKit" value={selectedBrandKitId} onChange={onBrandKitChange}>
              {brandKitOptions.map((brandKit) => (
                <MenuItem key={brandKit.id} value={brandKit.id}>
                  {brandKit.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <Box
        sx={{
          height: 'calc(100vh - 220px)',
          minHeight: 480,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'grid',
          gridTemplateColumns: '64px minmax(0, 1fr) 64px',
          alignItems: 'center',
        }}
      >
        <IconButton
          aria-label="Plantilla anterior"
          onClick={prev}
          disabled={filtered.length < 2}
          sx={{ justifySelf: 'center', border: '1px solid', borderColor: 'divider' }}
        >
          <ChevronLeftIcon />
        </IconButton>

        {selected ? (
          <Stack spacing={2} sx={{ minWidth: 0, maxHeight: '100%', overflow: 'hidden', p: { xs: 1, md: 3 } }}>
            <Paper
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden', maxWidth: 620, mx: 'auto', width: '100%' }}
            >
              <Box
                component="img"
                src={getTemplatePreviewImage(selected.layout)}
                alt={selected.name}
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: { xs: 300, md: 'calc(100vh - 430px)' },
                  minHeight: { xs: 220, md: 260 },
                  objectFit: 'contain',
                  display: 'block',
                  bgcolor: 'background.default',
                }}
              />
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1">{selected.name}</Typography>
                <Typography variant="body2" color="text.secondary">{areaLabels[selected.area]}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedBrandKitName}</Typography>
                {selected.description && (
                  <Typography variant="body2" color="text.secondary">{selected.description}</Typography>
                )}
              </Box>
            </Paper>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {selectedIndex + 1} de {filtered.length}
            </Typography>
          </Stack>
        ) : (
          <Alert severity="info">No hay plantillas disponibles para esta area.</Alert>
        )}

        <IconButton
          aria-label="Plantilla siguiente"
          onClick={next}
          disabled={filtered.length < 2}
          sx={{ justifySelf: 'center', border: '1px solid', borderColor: 'divider' }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>
    </Stack>
  )
}
