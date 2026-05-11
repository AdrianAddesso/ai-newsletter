import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import { useNewsletterStore } from '../stores/templates.store'
import { NewsletterCanvas } from '../components/canvas/NewsletterCanvas'
import { StructureControl } from '../components/canvas/StructureControl'
import { EditorControl } from '../components/canvas/EditorControl'

const TAB_LABELS = ['Crear', 'Editar', 'Revisar']

export function EditTemplatePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)

  const { 
    isSkeletonView, 
    setIsSkeletonView, 
    //saveTemplate, 
    resetStore,
    title 
  } = useNewsletterStore()

  // Initial load
  useEffect(() => {
    // If id exists, we should load data from API. For now, we just reset the store.
    resetStore({ id: id || undefined })
  }, [id, resetStore])

  const handleConfirmStructure = () => {
    setIsSkeletonView(false)
    setActiveTab(1)
  }

  // const handleSave = async () => {
  //   await saveTemplate()
  //   // Show success notification or similar
  // }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: 3,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <IconButton size="small" onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
          <ChevronLeftIcon />
        </IconButton>

        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Comunicación Interna
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {title}
          </Typography>
        </Box>

        <Chip
          label="Borrador"
          size="small"
          variant="outlined"
          sx={{ color: 'warning.dark', borderColor: 'warning.main' }}
        />
      </Box>

      {/* Content */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          p: 2,
          height: 'calc(100vh - 64px - 65px)',
        }}
      >
        {/* Panel izquierdo — Canvas */}
        <Paper
          elevation={0}
          sx={{
            flex: 2, // Give more space to the canvas
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              {isSkeletonView ? 'Diseño de Estructura' : 'Edición de Contenido'}
            </Typography>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: 4, bgcolor: '#E5E5E5' }}>
            <NewsletterCanvas />
          </Box>
        </Paper>

        {/* Panel derecho — controles */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': { fontWeight: 600, fontSize: 13 },
                '& .MuiTabs-indicator': { bgcolor: 'brand.red' },
                '& .Mui-selected': { color: 'brand.red !important' },
              }}
            >
              {TAB_LABELS.map((label, i) => (
                <Tab key={label} label={label} value={i} />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
            {activeTab === 0 && (
              <StructureControl onConfirm={handleConfirmStructure} />
            )}

            {activeTab === 1 && (
              <EditorControl />
            )}

            {activeTab === 2 && (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.disabled">
                  Flujo de revisión — próximamente
                </Typography>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1,
            }}
          >
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
