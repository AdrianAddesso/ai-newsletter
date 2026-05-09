import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import axios from 'axios'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import SendIcon from '@mui/icons-material/Send'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import ViewQuiltOutlinedIcon from '@mui/icons-material/ViewQuiltOutlined'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ViewModuleOutlinedIcon from '@mui/icons-material/ViewModuleOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { improveText } from '../api/ai'

interface Block {
  id: string
  label: string
  type: 'CONTENT' | 'MULTIMEDIA' | 'LAYOUT'
  content: string
}

interface MockTemplate {
  id: string
  title: string
  category: string
  subject: string
  blocks: Block[]
}

const MOCK_TEMPLATES: MockTemplate[] = [
  {
    id: '1',
    title: 'Template Actualizacion Interna',
    category: 'Comunicacion',
    subject: 'Las novedades más importantes del equipo esta semana',
    blocks: [
      { id: 'block-a', label: 'Bloque A', type: 'CONTENT', content: 'Introducción al contenido de la semana con las novedades más importantes del equipo. Este espacio resume los logros, noticias y actualizaciones relevantes para todos.' },
      { id: 'block-b', label: 'Bloque B', type: 'MULTIMEDIA', content: 'Imagen principal del template con el mensaje de la semana.' },
      { id: 'block-c', label: 'Bloque C', type: 'CONTENT', content: 'Sección de cierre con los próximos eventos y recordatorios importantes para el equipo durante la semana.' },
    ],
  },
  {
    id: '2',
    title: 'Template Newsletter Institucional',
    category: 'Marketing',
    subject: 'Resultados del trimestre y próximos objetivos',
    blocks: [
      { id: 'block-a', label: 'Bloque A', type: 'CONTENT', content: 'Mensaje institucional principal con los objetivos del trimestre y los resultados obtenidos hasta el momento.' },
      { id: 'block-b', label: 'Bloque B', type: 'LAYOUT', content: 'Sección de dos columnas con métricas clave del período.' },
      { id: 'block-c', label: 'Bloque C', type: 'CONTENT', content: 'Sección de novedades y lanzamientos recientes que impactan al equipo y los clientes.' },
      { id: 'block-d', label: 'Bloque D', type: 'MULTIMEDIA', content: 'Imagen de cierre con call to action hacia el portal interno.' },
    ],
  },
]

const TAB_LABELS = ['Crear', 'Editar', 'Revisar']

const BLOCK_TYPE_CONFIG = {
  CONTENT: {
    icon: <ArticleOutlinedIcon fontSize="small" />,
    color: '#E3F2FD',
    borderColor: '#90CAF9',
    label: 'Contenido',
  },
  MULTIMEDIA: {
    icon: <ImageOutlinedIcon fontSize="small" />,
    color: '#F3E5F5',
    borderColor: '#CE93D8',
    label: 'Multimedia',
  },
  LAYOUT: {
    icon: <ViewQuiltOutlinedIcon fontSize="small" />,
    color: '#E8F5E9',
    borderColor: '#A5D6A7',
    label: 'Layout',
  },
}

// Renderizado de un bloque individual en la vista previa de email
function EmailBlockPreview({
  block,
  isSelected,
  onClick,
}: {
  block: Block
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        cursor: 'pointer',
        outline: isSelected ? '2px solid #FF595A' : '2px solid transparent',
        outlineOffset: 2,
        borderRadius: 1,
        transition: 'outline 0.15s ease',
        '&:hover': { outline: isSelected ? '2px solid #FF595A' : '2px solid #bbb' },
      }}
    >
      {/* Etiqueta del bloque al hacer hover/seleccionar */}
      {isSelected && (
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            left: 8,
            bgcolor: '#FF595A',
            color: 'white',
            fontSize: 10,
            fontWeight: 700,
            px: 0.75,
            py: 0.25,
            borderRadius: 0.5,
            zIndex: 1,
            letterSpacing: 0.3,
          }}
        >
          {block.label}
        </Box>
      )}

      {block.type === 'CONTENT' && (
        <Box sx={{ py: 2, px: 3 }}>
          <Typography
            variant="body2"
            sx={{ color: '#30261D', lineHeight: 1.7, fontSize: 14 }}
          >
            {block.content}
          </Typography>
        </Box>
      )}

      {block.type === 'MULTIMEDIA' && (
        <Box
          sx={{
            height: 140,
            bgcolor: isSelected ? 'rgba(255,89,90,0.06)' : '#F5F5F5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            borderRadius: 1,
          }}
        >
          <ImageOutlinedIcon sx={{ color: '#bbb', fontSize: 32 }} />
          <Typography variant="caption" color="text.disabled">
            {block.content}
          </Typography>
        </Box>
      )}

      {block.type === 'LAYOUT' && (
        <Box sx={{ py: 2, px: 3, display: 'flex', gap: 1.5 }}>
          <Box
            sx={{
              flex: 1,
              height: 80,
              bgcolor: isSelected ? 'rgba(255,89,90,0.06)' : '#F5F5F5',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" color="text.disabled">
              Columna 1
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              height: 80,
              bgcolor: isSelected ? 'rgba(255,89,90,0.06)' : '#F5F5F5',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" color="text.disabled">
              Columna 2
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export function EditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const initialIndex = MOCK_TEMPLATES.findIndex(n => n.id === id)
  const [templatesData, setTemplatesData] = useState<MockTemplate[]>(MOCK_TEMPLATES)
  const [templateIndex, setTemplateIndex] = useState(initialIndex >= 0 ? initialIndex : 0)
  const [activeTab, setActiveTab] = useState(1)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [leftView, setLeftView] = useState<'blocks' | 'preview'>('blocks')
  const [isImproving, setIsImproving] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const template = templatesData[templateIndex]
  const selectedBlock = useMemo(
    () => template.blocks.find(b => b.id === selectedBlockId) ?? null,
    [selectedBlockId, template.blocks],
  )

  const updateSelectedBlockContent = (value: string) => {
    if (!selectedBlockId) {
      return
    }

    setTemplatesData((currentTemplates) =>
      currentTemplates.map((currentTemplate, currentTemplateIndex) => {
        if (currentTemplateIndex !== templateIndex) {
          return currentTemplate
        }

        return {
          ...currentTemplate,
          blocks: currentTemplate.blocks.map((block) =>
            block.id === selectedBlockId ? { ...block, content: value } : block,
          ),
        }
      }),
    )
  }

  const handleImproveSelectedBlock = async () => {
    if (!selectedBlock) {
      return
    }

    setIsImproving(true)
    setAiError(null)

    try {
      const response = await improveText({ text: selectedBlock.content })
      updateSelectedBlockContent(response.improvedText)
    } catch (error) {
      const fallbackMessage = 'No se pudo mejorar el texto en este momento.'

      if (axios.isAxiosError(error)) {
        const responseMessage =
          typeof error.response?.data?.message === 'string'
            ? error.response.data.message
            : null

        setAiError(responseMessage ?? fallbackMessage)
      } else {
        setAiError(fallbackMessage)
      }
    } finally {
      setIsImproving(false)
    }
  }

  const handleBlockClick = (blockId: string) => {
    setSelectedBlockId(blockId === selectedBlockId ? null : blockId)
    setActiveTab(1)
  }

  const handlePrev = () => {
    setTemplateIndex(i => Math.max(0, i - 1))
    setSelectedBlockId(null)
  }

  const handleNext = () => {
    setTemplateIndex(i => Math.min(MOCK_TEMPLATES.length - 1, i + 1))
    setSelectedBlockId(null)
  }

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
            {template.category}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {template.title}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <IconButton
            size="small"
            onClick={handlePrev}
            disabled={templateIndex === 0}
            sx={{ color: 'brand.red' }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40, textAlign: 'center' }}>
            {templateIndex + 1} / {MOCK_TEMPLATES.length}
          </Typography>
          <IconButton
            size="small"
            onClick={handleNext}
            disabled={templateIndex === MOCK_TEMPLATES.length - 1}
            sx={{ color: 'brand.red' }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Stack>

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
        {/* Panel izquierdo */}
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
          {/* Header del panel con toggle */}
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
              {leftView === 'blocks' ? 'Por bloques' : 'Vista previa'}
            </Typography>

            <ToggleButtonGroup
              value={leftView}
              exclusive
              onChange={(_, val) => { if (val) setLeftView(val) }}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  py: 0.25,
                  px: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&.Mui-selected': {
                    bgcolor: 'brand.red',
                    color: 'white',
                    borderColor: 'brand.red',
                    '&:hover': { bgcolor: '#e04040' },
                  },
                },
              }}
            >
              <ToggleButton value="blocks" aria-label="vista por bloques">
                <ViewModuleOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>Bloques</Typography>
              </ToggleButton>
              <ToggleButton value="preview" aria-label="vista previa">
                <VisibilityOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>Previa</Typography>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Vista por bloques */}
          {leftView === 'blocks' && (
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              <Stack spacing={1.5}>
                {template.blocks.map(block => {
                  const config = BLOCK_TYPE_CONFIG[block.type]
                  const isSelected = selectedBlockId === block.id
                  return (
                    <Paper
                      key={block.id}
                      onClick={() => handleBlockClick(block.id)}
                      elevation={0}
                      sx={{
                        p: 0,
                        cursor: 'pointer',
                        borderRadius: 1.5,
                        border: '2px solid',
                        borderColor: isSelected ? 'brand.red' : config.borderColor,
                        overflow: 'hidden',
                        transition: 'all 0.15s ease',
                        transform: isSelected ? 'translateY(-1px)' : 'none',
                        boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                        '&:hover': {
                          borderColor: isSelected ? 'brand.red' : 'text.secondary',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <Box sx={{ height: 4, bgcolor: isSelected ? 'brand.red' : config.borderColor }} />
                      <Box sx={{ p: 1.5, bgcolor: isSelected ? 'rgba(255,89,90,0.04)' : config.color }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                          <Box sx={{ color: isSelected ? 'brand.red' : 'text.secondary', display: 'flex' }}>
                            {config.icon}
                          </Box>
                          <Typography
                            variant="caption"
                            color={isSelected ? 'brand.red' : 'text.primary'}
                            sx={{ fontWeight: 700 }}
                          >
                            {block.label}
                          </Typography>
                          <Chip label={config.label} size="small" sx={{ height: 16, fontSize: 10, ml: 'auto' }} />
                        </Stack>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        >
                          {block.content}
                        </Typography>
                      </Box>
                    </Paper>
                  )
                })}
              </Stack>
            </Box>
          )}

          {/* Vista previa — simula el email */}
          {leftView === 'preview' && (
            <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#E5E5E5' }}>
              {/* Contenedor del email */}
              <Box
                sx={{
                  maxWidth: 520,
                  mx: 'auto',
                  bgcolor: 'white',
                  borderRadius: 1,
                  overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                }}
              >
                {/* Header del email */}
                <Box sx={{ bgcolor: '#FF595A', px: 3, py: 2 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mb: 0.25 }}>
                    {template.category}
                  </Typography>
                  <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>
                    {template.title}
                  </Typography>
                </Box>

                {/* Asunto */}
                <Box sx={{ px: 3, py: 1.5, bgcolor: '#FFF8F8', borderBottom: '1px solid #FFE0E0' }}>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Asunto:</strong> {template.subject}
                  </Typography>
                </Box>

                {/* Bloques del email */}
                <Box>
                  {template.blocks.map((block, index) => (
                    <Box key={block.id}>
                      <EmailBlockPreview
                        block={block}
                        isSelected={selectedBlockId === block.id}
                        onClick={() => handleBlockClick(block.id)}
                      />
                      {index < template.blocks.length - 1 && (
                        <Divider sx={{ mx: 3, borderColor: '#F0F0F0' }} />
                      )}
                    </Box>
                  ))}
                </Box>

                {/* Footer del email */}
                <Box sx={{ bgcolor: '#F5F5F5', px: 3, py: 2, borderTop: '1px solid #E0E0E0' }}>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center' }}>
                    Nestlé Argentina · Template interno
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center' }}>
                    Para cancelar suscripción, hacé clic aquí
                  </Typography>
                </Box>
              </Box>

              {selectedBlockId && (
                <Box sx={{ maxWidth: 520, mx: 'auto', mt: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#FF595A', fontWeight: 600 }}>
                    {template.blocks.find(b => b.id === selectedBlockId)?.label} seleccionado — editalo en el panel derecho
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Footer del panel */}
          <Box
            sx={{
              px: 2.5,
              py: 1,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {template.blocks.length} bloques
            </Typography>
            {selectedBlockId && (
              <Typography variant="caption" sx={{ color: 'brand.red', fontWeight: 600 }}>
                {template.blocks.find(b => b.id === selectedBlockId)?.label} seleccionado
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Panel derecho — edición */}
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
            {activeTab === 1 && (
              selectedBlock ? (
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        bgcolor: BLOCK_TYPE_CONFIG[selectedBlock.type].color,
                        border: '1px solid',
                        borderColor: BLOCK_TYPE_CONFIG[selectedBlock.type].borderColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.secondary',
                      }}
                    >
                      {BLOCK_TYPE_CONFIG[selectedBlock.type].icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {selectedBlock.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {BLOCK_TYPE_CONFIG[selectedBlock.type].label}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  {aiError && <Alert severity="error">{aiError}</Alert>}

                  <Box
                    sx={{
                      bgcolor: 'grey.50',
                      borderRadius: 1.5,
                      p: 2,
                      border: '1px dashed',
                      borderColor: 'divider',
                      minHeight: 120,
                    }}
                  >
                    <TextField
                      label="Texto del bloque"
                      value={selectedBlock.content}
                      onChange={(event) => updateSelectedBlockContent(event.target.value)}
                      multiline
                      minRows={5}
                      fullWidth
                    />
                  </Box>

                  <Stack spacing={1}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                    >
                      Acciones
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      {selectedBlock.type === 'MULTIMEDIA' && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<CloudUploadOutlinedIcon />}
                          sx={{ borderRadius: 1.5 }}
                        >
                          Subir imagen
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AutoAwesomeIcon />}
                        disabled={isImproving}
                        onClick={() => void handleImproveSelectedBlock()}
                        sx={{
                          borderRadius: 1.5,
                          borderColor: 'brand.red',
                          color: 'brand.red',
                          '&:hover': { bgcolor: 'rgba(255,89,90,0.04)', borderColor: 'brand.red' },
                        }}
                      >
                        {isImproving ? 'Mejorando...' : 'Mejorar con IA'}
                      </Button>
                    </Stack>
                  </Stack>
                </Stack>
              ) : (
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, py: 6 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: 'grey.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    <ArticleOutlinedIcon />
                  </Box>
                  <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center' }}>
                    Seleccioná un bloque para editar sus atributos
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center' }}>
                    Usá la vista "Bloques" o "Previa" del panel izquierdo
                  </Typography>
                </Box>
              )
            )}

            {activeTab === 0 && (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.disabled">
                  Flujo de creación — próximamente
                </Typography>
              </Box>
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
            <Button variant="outlined" size="small" sx={{ borderRadius: 1.5 }}>
              Guardar borrador
            </Button>
            <Button
              variant="contained"
              size="small"
              endIcon={<SendIcon />}
            >
              Enviar a revisión
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
