import { useEffect, useMemo, useState } from 'react'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { v4 as uuidv4 } from 'uuid'
import { useNavigate, useParams } from 'react-router'
import { getTemplateById } from '../api/templates'
import { EditorControl } from '../components/canvas/EditorControl'
import { StructureControl } from '../components/canvas/StructureControl'
import { Template } from '../components/canvas/Template'
import { useNotification } from '../hooks/useNotification'
import type { RowObject } from '../interfaces/interfaces.templates'
import { useTemplateStore } from '../stores/templates.store'
import type { TemplateLayoutBlock } from '../types/newsletter'
import { TAB_LABELS } from '@shared/enums/tab-enum'

const buildRowsFromLayout = (
  layout: TemplateLayoutBlock[] | null,
): RowObject[] => {
  if (!layout || layout.length === 0) {
    return [
      {
        id: uuidv4(),
        rowIndex: 0,
        columns: [
          {
            id: uuidv4(),
            type: null,
            content: null,
            mustFill: false,
            displayOrder: 0,
          },
        ],
      },
    ]
  }

  const rowsByIndex = new Map<number, TemplateLayoutBlock[]>()

  layout.forEach((block) => {
    const blocks = rowsByIndex.get(block.row) ?? []
    blocks.push(block)
    rowsByIndex.set(block.row, blocks)
  })

  return [...rowsByIndex.entries()]
    .sort(([left], [right]) => left - right)
    .map(([rowIndex, blocks]) => ({
      id: uuidv4(),
      rowIndex,
      columns: [...blocks]
        .sort((left, right) => left.grid_column - right.grid_column)
        .map((block) => ({
          id: uuidv4(),
          type: block.block_type,
          content: block.content,
          mustFill: block.mustFill ?? false,
          displayOrder: block.grid_column,
        })),
    }))
}

export function EditTemplatePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success, error } = useNotification()
  const [activeTab, setActiveTab] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const {
    isSkeletonView,
    setIsSkeletonView,
    saveTemplate,
    resetStore,
    rows,
    name,
    description,
    area,
  } = useTemplateStore()

  useEffect(() => {
    let mounted = true

    const loadTemplate = async () => {
      if (!id) {
        if (mounted) {
          setLoadError('No se encontró el template solicitado.')
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setLoadError(null)

      try {
        const template = await getTemplateById(id)

        if (!mounted) {
          return
        }

        resetStore({
          name: template.name,
          description: template.description ?? '',
          promptBase: template.promptBase,
          area: template.area,
          state: template.stateCode,
          layoutMode: template.orientation,
          rows: buildRowsFromLayout(template.layout),
          isSkeletonView: false,
        })
        setActiveTab(1)
        setIsInitialized(true)
      } catch {
        if (mounted) {
          setLoadError('No se pudo cargar el template para editarlo.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadTemplate()

    return () => {
      mounted = false
    }
  }, [id, resetStore])

  useEffect(() => {
    if (!isInitialized) {
      return
    }

    setIsSkeletonView(activeTab === 0)
  }, [activeTab, isInitialized, setIsSkeletonView])

  const handleConfirmStructure = () => {
    setIsSkeletonView(false)
    setActiveTab(1)
  }

  const handleSaveTemplate = async () => {
    if (!id) {
      error('No se encontró el template solicitado')
      return
    }

    setIsSaving(true)

    try {
      const response = await saveTemplate(id)
      success(response.message || 'Template actualizado exitosamente')
      navigate('/templates')
    } catch (requestError: unknown) {
      if (requestError instanceof Error) {
        error(requestError.message || 'Error al guardar el template')
      } else {
        error('Error al guardar el template')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const isSaveDisabled = useMemo(() => {
    const hasAtLeastOneBlock = rows.some((row) =>
      row.columns.some((column) => column.type),
    )

    return (
      !hasAtLeastOneBlock ||
      name.length < 3 ||
      name.length > 50 ||
      description.length < 5 ||
      description.length > 200 ||
      area.length === 0 ||
      isSaving
    )
  }, [area.length, description.length, isSaving, name.length, rows])

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.50',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (loadError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{loadError}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: 'calc(100vh - 64px)' }}>
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: { xs: 2, md: 3 },
          py: 1.5,
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <IconButton size="small" onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
          <ChevronLeftIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Editar Template
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Modifica nombre, área, prompt y bloques del template seleccionado.
          </Typography>
        </Box>
        <Chip
          label="Editable"
          size="small"
          variant="outlined"
          sx={{ color: 'warning.dark', borderColor: 'warning.main' }}
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          p: 2,
          height: { xs: 'auto', md: 'calc(100vh - 64px - 65px)' },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            flex: 2,
            order: { xs: 2, md: 1 },
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: { xs: 420, md: 0 },
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
          <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 4 }, bgcolor: '#E5E5E5' }}>
            <Template />
          </Box>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            order: { xs: 1, md: 2 },
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: { xs: 0, md: 0 },
          }}
        >
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': { fontWeight: 600, fontSize: 13 },
                '& .MuiTabs-indicator': { bgcolor: 'brand.red' },
                '& .Mui-selected': { color: 'brand.red !important' },
              }}
            >
              {TAB_LABELS.map((label: string, index: number) => (
                <Tab key={label} label={label} value={index} disabled={index === 2} />
              ))}
            </Tabs>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
            {activeTab === 0 && <StructureControl onConfirm={handleConfirmStructure} />}
            {activeTab === 1 && <EditorControl />}
            {activeTab === 2 && (
              <Alert severity="info">
                La revisión del template no forma parte de este flujo de edición.
              </Alert>
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
            {!isSkeletonView && activeTab === 1 && (
              <Button
                variant="contained"
                fullWidth
                onClick={handleSaveTemplate}
                disabled={isSaveDisabled}
              >
                {isSaving ? 'Guardando...' : 'Guardar Template'}
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
