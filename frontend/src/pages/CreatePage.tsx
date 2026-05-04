import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactElement,
} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'
import type { UserRole } from '../contexts/AuthContext'
import { useAuth } from '../contexts/AuthContext'
import templateClassicImage from '../assets/we_make_nestle/wmn-lockup-one-line-dark-oak-on-white.jpg'
import templateEditorialImage from '../assets/we_make_nestle/wmn-lockup-two-lines-dark-oak-on-white.jpg'
import templateBriefImage from '../assets/we_make_nestle/wmn-lockup-three-lines-dark-oak-on-white.jpg'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
  type AssetType,
  type UploadedAsset,
  listAssets,
  uploadAssets,
} from '../api/assets'
import {
  type GenerateNewsletterRequest,
} from '../api/ai'
import { 
  

 } from '../services/newsletters.ts'

// ⚠️ ARREGLAR ⚠️ — la generacion con IA está mockeada, descomentar cuando el servicio ande
// import {
//   generateNewsletter as generateNewsletterWithAi,
//   improveText,
// } from '../api/ai'

type NewsletterState =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'DISCARDED'

type AreaName = 'COMUNICACION_INTERNA' | 'COMUNICACION_CORPORATIVA'

type BrandKitId = 'nestle-corporate' | 'nescafe' | 'kit-kat'

type TemplateGenerationField =
  | 'relevantDates'
  | 'cta'
  | 'contact'
  | 'linksOrSources'
  | 'additionalContext'

type NewsletterBlock = {
  id: string
  name: string
  text: string
  backgroundColor: string
  comment: string | null
}

type NewsletterTemplate = {
  id: string
  name: string
  imageUrl: string
  area: AreaName
  brandKitId: BrandKitId
  requiredGenerationFields: TemplateGenerationField[]
  optionalGenerationFields: TemplateGenerationField[]
}

type ExportOption = {
  id: string
  label: string
  format: 'PNG'
}

type StateChangeLogPayload = {
  newsletter_id: string
  previous_state: NewsletterState
  new_state: NewsletterState
  reviewed_by_user_id: string
  all_commentaries: string[]
  created_at: string
}

type CreatePageContext = {
  newsletterId: string
  creatorUserId: string
  currentUserId: string
  currentUserRole: UserRole
  newsletterState: NewsletterState
  isGenerated: boolean
  templates: NewsletterTemplate[]
  selectedTemplateId: string
  blocks: NewsletterBlock[]
  selectedBlockId: string
  newsletterComment: string | null
  renderedHtml: string
  exportOptions: ExportOption[]
  isRenderingHtml: boolean
  isExportingPng: boolean
  onGenerate: (request: GenerateNewsletterRequest) => Promise<void>
  onResetGeneration: () => void
  onSelectTemplate: (templateId: string) => void
  onCancel: () => void
  onSendForReview: () => Promise<void>
  onSendFeedback: () => void
  onApprove: () => void
  onResendForReview: () => void
  onSelectBlock: (blockId: string) => void
  onUpdateBlockText: (blockId: string, value: string) => void
  onUpdateBlockBackground: (blockId: string, value: string) => void
  onRegenerateBlockText: (blockId: string) => Promise<void>
  onSaveNewsletterComment: (value: string) => void
  onSaveBlockComment: (blockId: string, value: string) => void
  onExportToPng: () => Promise<void>
  //improvingBlockId: string | null
  isGenerating: boolean
  isSendingForReview: boolean
  aiError: string | null
}

type PaneProps = {
  context: CreatePageContext
}

type StatePaneConfig = {
  PreviewPane: (props: PaneProps) => ReactElement
  ActionPane: (props: PaneProps) => ReactElement
}

const emptyComment = (value: string | null): boolean => !value || value.trim().length === 0

const areaLabels: Record<AreaName, string> = {
  COMUNICACION_INTERNA: 'Comunicacion interna',
  COMUNICACION_CORPORATIVA: 'Comunicacion corporativa',
}

const brandKitLabels: Record<BrandKitId, string> = {
  'nestle-corporate': 'Nestle Corporate',
  nescafe: 'Nescafe',
  'kit-kat': 'KitKat',
}

const SHARED_OPTIONAL_FIELDS: TemplateGenerationField[] = [
  'relevantDates',
  'cta',
  'linksOrSources',
  'additionalContext',
]

const templates: NewsletterTemplate[] = [
  {
    id: 'corporate-update',
    name: 'Actualizacion corporativa',
    imageUrl: templateClassicImage,
    area: 'COMUNICACION_INTERNA',
    brandKitId: 'nestle-corporate',
    requiredGenerationFields: [],
    optionalGenerationFields: SHARED_OPTIONAL_FIELDS,
  },
  {
    id: 'people-story',
    name: 'Historia de equipos',
    imageUrl: templateEditorialImage,
    area: 'COMUNICACION_INTERNA',
    brandKitId: 'nescafe',
    requiredGenerationFields: ['contact'],
    optionalGenerationFields: SHARED_OPTIONAL_FIELDS,
  },
  {
    id: 'weekly-brief',
    name: 'Resumen semanal',
    imageUrl: templateBriefImage,
    area: 'COMUNICACION_CORPORATIVA',
    brandKitId: 'nestle-corporate',
    requiredGenerationFields: [],
    optionalGenerationFields: SHARED_OPTIONAL_FIELDS,
  },
  {
    id: 'leadership-note',
    name: 'Mensaje de liderazgo',
    imageUrl: templateClassicImage,
    area: 'COMUNICACION_CORPORATIVA',
    brandKitId: 'nescafe',
    requiredGenerationFields: ['contact'],
    optionalGenerationFields: SHARED_OPTIONAL_FIELDS,
  },
  {
    id: 'culture-highlight',
    name: 'Cultura y reconocimiento',
    imageUrl: templateEditorialImage,
    area: 'COMUNICACION_CORPORATIVA',
    brandKitId: 'kit-kat',
    requiredGenerationFields: [],
    optionalGenerationFields: SHARED_OPTIONAL_FIELDS,
  },
]

// ⚠️ ARREGLAR ⚠️ — estos bloques deberían venir de la IA
function buildMockBlocks(request: GenerateNewsletterRequest): NewsletterBlock[] {
  return [
    {
      id: 'header',
      name: 'Encabezado',
      text: request.topic,
      backgroundColor: '#FFFFFF',
      comment: null,
    },
    {
      id: 'headline',
      name: 'Titulo principal',
      text: request.objective,
      backgroundColor: '#97CAEB',
      comment: null,
    },
    {
      id: 'body',
      name: 'Cuerpo',
      text: request.keyMessages.join(' · '),
      backgroundColor: '#FFFFFF',
      comment: null,
    },
    {
      id: 'cta',
      name: 'Llamado a la accion',
      text: request.cta ?? 'Conoce mas en el portal interno.',
      backgroundColor: '#FFC600',
      comment: null,
    },
  ]
}

const initialBlocks: NewsletterBlock[] = [
  {
    id: 'header',
    name: 'Encabezado',
    text: 'Noticias internas para estar cerca de lo importante.',
    backgroundColor: '#FFFFFF',
    comment: null,
  },
  {
    id: 'headline',
    name: 'Titulo principal',
    text: 'Avances, aprendizajes y proximos pasos del equipo.',
    backgroundColor: '#97CAEB',
    comment: null,
  },
  {
    id: 'body',
    name: 'Cuerpo',
    text: 'Compartimos novedades relevantes para que cada area pueda actuar con claridad.',
    backgroundColor: '#FFFFFF',
    comment: null,
  },
  {
    id: 'cta',
    name: 'Llamado a la accion',
    text: 'Conoce mas en el portal interno.',
    backgroundColor: '#FFC600',
    comment: null,
  },
]

const fallbackRenderedHtml = `
  <!doctype html>
  <html lang="es">
    <body style="margin:0;font-family:Arial,sans-serif;color:#30261D;background:#FFFFFF;">
      <main style="max-width:680px;margin:0 auto;border:1px solid #E7E1DC;">
        <section style="padding:32px;background:#FF595A;color:#FFFFFF;">
          <h1 style="margin:0;font-size:34px;">Newsletter Nestle</h1>
          <p style="margin:12px 0 0;">Lista para publicacion interna.</p>
        </section>
        <section style="padding:28px;">
          <h2 style="margin-top:0;">Avances, aprendizajes y proximos pasos del equipo.</h2>
          <p>Compartimos novedades relevantes para que cada area pueda actuar con claridad.</p>
        </section>
      </main>
    </body>
  </html>
`

function logStateChange(payload: StateChangeLogPayload): void {
  console.info('Newsletter state changed', payload)
}

async function renderNewsletterHtml(blocks: NewsletterBlock[]): Promise<string> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 250)
  })

  const sections = blocks
    .map(
      (block) => `
        <section style="padding:24px;background:${block.backgroundColor};">
          <h2 style="margin:0 0 8px;font-size:24px;">${block.name}</h2>
          <p style="margin:0;font-size:17px;line-height:1.5;">${block.text}</p>
        </section>
      `,
    )
    .join('')

  return `
    <!doctype html>
    <html lang="es">
      <body style="margin:0;font-family:Arial,sans-serif;color:#30261D;background:#F8F5F2;">
        <main style="max-width:680px;margin:0 auto;background:#FFFFFF;border:1px solid #E7E1DC;">
          ${sections}
        </main>
      </body>
    </html>
  `
}

async function fetchExportOptions(): Promise<ExportOption[]> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 150)
  })

  return [{ id: 'png', label: 'Exportar a PNG', format: 'PNG' }]
}

async function exportHtmlToPng(): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 250)
  })
}

function selectedBlockFrom(context: CreatePageContext): NewsletterBlock {
  return (
    context.blocks.find((block) => block.id === context.selectedBlockId) ??
    context.blocks[0]
  )
}

function TemplateCarousel({
  templates: carouselTemplates,
  onSelectTemplate,
}: {
  templates: NewsletterTemplate[]
  onSelectTemplate: (templateId: string) => void
}) {
  const [selectedArea, setSelectedArea] = useState<AreaName>('COMUNICACION_INTERNA')
  const [selectedBrandKitId, setSelectedBrandKitId] = useState<BrandKitId>('nestle-corporate')
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0)
  const filteredTemplates = carouselTemplates.filter(
    (template) => template.area === selectedArea && template.brandKitId === selectedBrandKitId,
  )
  const selectedTemplate = filteredTemplates[selectedTemplateIndex] ?? filteredTemplates[0]

  useEffect(() => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate.id)
    }
  }, [onSelectTemplate, selectedTemplate])

  const goToPreviousTemplate = () => {
    if (filteredTemplates.length < 1) return
    setSelectedTemplateIndex((i) => (i === 0 ? filteredTemplates.length - 1 : i - 1))
  }

  const goToNextTemplate = () => {
    if (filteredTemplates.length < 1) return
    setSelectedTemplateIndex((i) => (i === filteredTemplates.length - 1 ? 0 : i + 1))
  }

  const selectArea = (event: SelectChangeEvent<AreaName>) => {
    setSelectedArea(event.target.value as AreaName)
    setSelectedTemplateIndex(0)
  }

  const selectBrandKit = (event: SelectChangeEvent<BrandKitId>) => {
    setSelectedBrandKitId(event.target.value as BrandKitId)
    setSelectedTemplateIndex(0)
  }

  return (
    <Stack spacing={2}>
      <Stack spacing={1.5}>
        <Typography variant="h5">Elegir plantilla</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="template-area-label">Area</InputLabel>
            <Select labelId="template-area-label" label="Area" value={selectedArea} onChange={selectArea}>
              {Object.entries(areaLabels).map(([area, label]) => (
                <MenuItem key={area} value={area}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel id="template-brand-kit-label">BrandKit</InputLabel>
            <Select labelId="template-brand-kit-label" label="BrandKit" value={selectedBrandKitId} onChange={selectBrandKit}>
              {Object.entries(brandKitLabels).map(([brandKitId, label]) => (
                <MenuItem key={brandKitId} value={brandKitId}>{label}</MenuItem>
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
          onClick={goToPreviousTemplate}
          disabled={filteredTemplates.length < 2}
          sx={{ justifySelf: 'center', border: '1px solid', borderColor: 'divider' }}
        >
          <ChevronLeftIcon />
        </IconButton>

        {selectedTemplate ? (
          <Stack spacing={2} sx={{ minWidth: 0, maxHeight: '100%', overflow: 'hidden', p: { xs: 1, md: 3 } }}>
            <Paper
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden', maxWidth: 620, mx: 'auto', width: '100%', maxHeight: '100%' }}
            >
              <Box
                component="img"
                src={selectedTemplate.imageUrl}
                alt={selectedTemplate.name}
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
                <Typography variant="subtitle1">{selectedTemplate.name}</Typography>
                <Typography variant="body2" color="text.secondary">{areaLabels[selectedTemplate.area]}</Typography>
                <Typography variant="body2" color="text.secondary">{brandKitLabels[selectedTemplate.brandKitId]}</Typography>
              </Box>
            </Paper>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {selectedTemplateIndex + 1} de {filteredTemplates.length}
            </Typography>
          </Stack>
        ) : (
          <Alert severity="info">No hay plantillas disponibles para esta area.</Alert>
        )}

        <IconButton
          aria-label="Plantilla siguiente"
          onClick={goToNextTemplate}
          disabled={filteredTemplates.length < 2}
          sx={{ justifySelf: 'center', border: '1px solid', borderColor: 'divider' }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>
    </Stack>
  )
}

function BlockList({ context, readOnly = false }: PaneProps & { readOnly?: boolean }) {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5">Bloques de la plantilla</Typography>
        {readOnly && <Chip label="Solo lectura" />}
      </Stack>

      <Stack spacing={1.5}>
        {context.blocks.map((block) => {
          const isSelected = block.id === context.selectedBlockId
          return (
            <Paper
              key={block.id}
              component="button"
              elevation={0}
              disabled={readOnly}
              onClick={() => context.onSelectBlock(block.id)}
              sx={{
                width: '100%',
                textAlign: 'left',
                border: '2px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: block.backgroundColor,
                color: 'text.primary',
                cursor: readOnly ? 'default' : 'pointer',
                p: 2,
              }}
            >
              <Typography variant="subtitle1">{block.name}</Typography>
              <Typography variant="body2">{block.text}</Typography>
              {!emptyComment(block.comment) && (
                <Alert severity="info" sx={{ mt: 1.5 }}>{block.comment}</Alert>
              )}
            </Paper>
          )
        })}
      </Stack>
    </Stack>
  )
}

function PermissionDeniedPane() {
  return (
    <Alert severity="warning">
      No tenes permisos para ver esta instancia del flujo.
    </Alert>
  )
}

function DraftPreviewPane({ context }: PaneProps) {
  if (!context.isGenerated) {
    return (
      <TemplateCarousel
        templates={context.templates}
        onSelectTemplate={context.onSelectTemplate}
      />
    )
  }
  return <BlockList context={context} />
}

function DraftActionPane({ context }: PaneProps) {
  const selectedBlock = selectedBlockFrom(context)
  const selectedTemplate =
    context.templates.find((template) => template.id === context.selectedTemplateId) ??
    context.templates[0]

  const activeTab = context.isGenerated ? 1 : 0

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0 && context.isGenerated) {
      context.onResetGeneration()
    }
  }

  return (
    <Stack spacing={2}>
      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tab label="Generar" />
        <Tab label="Editar" disabled={!context.isGenerated} />
      </Tabs>

      {!context.isGenerated ? (
        <GenerationForm context={context} selectedTemplate={selectedTemplate} />
      ) : (
        <EditForm
          context={context}
          selectedBlock={selectedBlock}
          submitLabel="Enviar a revision"
          onSubmit={() => void context.onSendForReview()}
        />
      )}
    </Stack>
  )
}

type NewsletterGenerationForm = {
  topic: string
  objective: string
  audience: string
  keyMessages: string
  tone: string
  relevantDates: string
  cta: string
  contact: string
  linksOrSources: string
  additionalContext: string
  assetType: AssetType
  files: File[]
}

const generationFieldLabels: Record<TemplateGenerationField, string> = {
  relevantDates: 'Fecha CTA',
  cta: 'Texto CTA ',
  contact: 'Contacto',
  linksOrSources: 'Link CTA ',
  additionalContext: 'Contexto adicional',
}

const assetTypeLabels: Record<AssetType, string> = {
  IMAGE: 'Imagen',
  ICON: 'Icono',
  LOGO: 'Logo',
  SHAPE: 'Forma',
  LOCKUP: 'Lockup',
  KEYWORD: 'Keyword',
}

const splitLines = (value: string): string[] =>
  value.split('\n').map((line) => line.trim()).filter((line) => line.length > 0)


const isValidUrl = (link: string): boolean => {
  try {
    const url = new URL(link)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const validateLinks = (value: string): string | null => {
  const links = value
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (links.length === 0) return null

  const invalid = links.some((link) => !isValidUrl(link))
  return invalid ? 'Todos los links deben ser válidos (http/https).' : null
}

const validateDate = (value: string): string | null => {
  if (!value.trim()) return null
  return isNaN(Date.parse(value)) ? 'Debe ser una fecha válida.' : null
}

function GenerationForm({
  context,
  selectedTemplate,
}: {
  context: CreatePageContext
  selectedTemplate: NewsletterTemplate
}) {
  const [form, setForm] = useState<NewsletterGenerationForm>({
    topic: '',
    objective: '',
    audience: '',
    keyMessages: '',
    tone: '',
    relevantDates: '',
    cta: '',
    contact: '',
    linksOrSources: '',
    additionalContext: '',
    assetType: 'IMAGE',
    files: [],
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [availableAssets, setAvailableAssets] = useState<UploadedAsset[]>([])
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([])
  const [selectedExistingAssetIds, setSelectedExistingAssetIds] = useState<string[]>([])
  const [assetListError, setAssetListError] = useState<string | null>(null)
  const [isLoadingAssets, setIsLoadingAssets] = useState(false)
  const [assetUploadError, setAssetUploadError] = useState<string | null>(null)
  const [isUploadingAssets, setIsUploadingAssets] = useState(false)
  const visibleGenerationFields = new Set<TemplateGenerationField>([
    ...selectedTemplate.requiredGenerationFields,
    ...selectedTemplate.optionalGenerationFields,
  ])

  const updateFormField = (field: keyof NewsletterGenerationForm, value: string | File[]) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
    setFormErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }
      delete nextErrors[field]
      return nextErrors
    })
  }

  useEffect(() => {
    let isMounted = true

    const loadAvailableAssets = async () => {
      setIsLoadingAssets(true)
      setAssetListError(null)

      try {
        const response = await listAssets(form.assetType)

        if (!isMounted) return

        setAvailableAssets(response.assets)
      } catch (error) {
        if (!isMounted) return

        const fallbackMessage = 'No se pudieron obtener los assets disponibles.'
        setAssetListError(
          axios.isAxiosError(error)
            ? error.response?.data?.message ?? fallbackMessage
            : fallbackMessage,
        )
        setAvailableAssets([])
      } finally {
        if (isMounted) {
          setIsLoadingAssets(false)
        }
      }
    }

    void loadAvailableAssets()

    return () => {
      isMounted = false
    }
  }, [form.assetType])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!form.topic.trim()) errors.topic = 'El tema es obligatorio.'
    if (!form.objective.trim()) errors.objective = 'El objetivo es obligatorio.'
    if (!form.audience.trim()) errors.audience = 'La audiencia es obligatoria.'
    if (splitLines(form.keyMessages).length < 1) errors.keyMessages = 'Ingresa al menos un mensaje clave.'
    if (!form.tone.trim()) errors.tone = 'El tono deseado es obligatorio.'

    // Validaciones reutilizables
    const linkError = validateLinks(form.linksOrSources)
    if (linkError) errors.linksOrSources = linkError

    const dateError = validateDate(form.relevantDates)
    if (dateError) errors.relevantDates = dateError

    // Required dinámicos
    selectedTemplate.requiredGenerationFields.forEach((field) => {
      if (!form[field]?.toString().trim()) {
        errors[field] = `${generationFieldLabels[field]} es obligatorio para esta plantilla.`
      }
    })

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const submitGenerationForm = async () => {
    if (!validateForm()) return
    let assetIds = [...selectedExistingAssetIds]
    setAssetUploadError(null)

    if (form.files.length > 0) {
      setIsUploadingAssets(true)

      try {
        const uploadResponse = await uploadAssets(form.files, form.assetType)
        setUploadedAssets(uploadResponse.assets)
        assetIds = [
          ...selectedExistingAssetIds,
          ...uploadResponse.assets.map((asset) => asset.id),
        ]
      } catch (error) {
        const fallbackMessage = 'No se pudieron cargar los assets en este momento.'
        setAssetUploadError(
          axios.isAxiosError(error)
            ? error.response?.data?.message ?? fallbackMessage
            : fallbackMessage,
        )
        return
      } finally {
        setIsUploadingAssets(false)
      }
    } else {
      setUploadedAssets([])
    }

    const request: GenerateNewsletterRequest = {
      area: selectedTemplate.area,
      templateId: selectedTemplate.id,
      topic: form.topic.trim(),
      objective: form.objective.trim(),
      audience: form.audience.trim(),
      keyMessages: splitLines(form.keyMessages),
      tone: form.tone.trim(),
      relevantDates: form.relevantDates.trim() || undefined,
      cta: form.cta.trim() || undefined,
      contact: form.contact.trim() || undefined,
      linksOrSources: splitLines(form.linksOrSources),
      additionalContext: form.additionalContext.trim() || undefined,
      assetIds,
    }

    await context.onGenerate(request)
  }

  return (
    <Stack spacing={2}>
      {context.aiError && <Alert severity="error">{context.aiError}</Alert>}
      {assetUploadError && <Alert severity="error">{assetUploadError}</Alert>}
      <Alert severity="info">
        Plantilla seleccionada: {selectedTemplate.name}
      </Alert>

      <Stack spacing={2}>
        <TextField
          label="Departamento o area"
          required
          slotProps={{ inputLabel: { required: false } }}
          value={areaLabels[selectedTemplate.area]}
          fullWidth
          disabled
        />
        <TextField
          label="Tema del newsletter"
          required
          slotProps={{ inputLabel: { required: false } }}
          value={form.topic}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateFormField("topic", e.target.value)
          }
          error={!!formErrors.topic}
          helperText={formErrors.topic}
          fullWidth
        />
        <TextField
          label="Objetivo"
          required
          slotProps={{ inputLabel: { required: false } }}
          value={form.objective}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateFormField("objective", e.target.value)
          }
          error={!!formErrors.objective}
          helperText={formErrors.objective}
          multiline
          minRows={2}
          fullWidth
        />
        <TextField
          label="Audiencia"
          required
          slotProps={{ inputLabel: { required: false } }}
          value={form.audience}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateFormField("audience", e.target.value)
          }
          error={!!formErrors.audience}
          helperText={formErrors.audience}
          fullWidth
        />
        <TextField
          label="Mensajes clave"
          required
          slotProps={{ inputLabel: { required: false } }}
          value={form.keyMessages}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateFormField("keyMessages", e.target.value)
          }
          error={!!formErrors.keyMessages}
          helperText={formErrors.keyMessages || "Escribi un mensaje por linea."}
          multiline
          minRows={3}
          fullWidth
        />
        <TextField
          label="Tono deseado"
          required
          slotProps={{ inputLabel: { required: false } }}
          value={form.tone}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateFormField("tone", e.target.value)
          }
          error={!!formErrors.tone}
          helperText={formErrors.tone}
          fullWidth
        />
      </Stack>
      <Stack spacing={2}>
        {selectedTemplate.requiredGenerationFields.length > 0 && (
          <Alert severity="warning">
            Esta plantilla requiere:{" "}
            {selectedTemplate.requiredGenerationFields
              .map((f) => generationFieldLabels[f])
              .join(", ")}
          </Alert>
        )}
        {visibleGenerationFields.has("relevantDates") && (
          <TextField
            label="Fecha CTA"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={form.relevantDates}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateFormField("relevantDates", e.target.value)
            }
            error={!!formErrors.relevantDates}
            helperText={formErrors.relevantDates}
            fullWidth
          />
        )}
        {visibleGenerationFields.has("cta") && (
          <TextField
            label="Texto CTA"
            value={form.cta}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateFormField("cta", e.target.value)
            }
            error={!!formErrors.cta}
            helperText={formErrors.cta}
            fullWidth
          />
        )}
        {visibleGenerationFields.has("contact") && (
          <TextField
            label="Contacto"
            value={form.contact}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateFormField("contact", e.target.value)
            }
            error={!!formErrors.contact}
            helperText={formErrors.contact}
            fullWidth
          />
        )}
        {visibleGenerationFields.has("linksOrSources") && (
          <TextField
            label="Link CTA "
            type="url"
            value={form.linksOrSources}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              updateFormField("linksOrSources", value);

              const error = validateLinks(value);

              setFormErrors((prev) => {
                const next = { ...prev };

                if (error) next.linksOrSources = error;
                else delete next.linksOrSources;

                return next;
              });
            }}
            error={!!formErrors.linksOrSources}
            helperText={
              formErrors.linksOrSources || "Escribi un link o fuente por linea."
            }
            multiline
            minRows={2}
            fullWidth
          />
        )}

        <FormControl fullWidth size="small">
          <InputLabel id="asset-type-label">Tipo de asset</InputLabel>
          <Select
            labelId="asset-type-label"
            label="Tipo de asset"
            value={form.assetType}
            onChange={(event: SelectChangeEvent<AssetType>) => {
              updateFormField('assetType', event.target.value)
              setSelectedExistingAssetIds([])
              setUploadedAssets([])
              setAssetUploadError(null)
            }}
          >
            {Object.entries(assetTypeLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {assetListError && <Alert severity="error">{assetListError}</Alert>}
        {isLoadingAssets ? (
          <Alert severity="info">Cargando assets existentes...</Alert>
        ) : availableAssets.length > 0 ? (
          <Stack spacing={1}>
            <Typography variant="subtitle2">Assets existentes</Typography>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ flexWrap: 'wrap' }}
            >
              {availableAssets.map((asset) => {
                const isSelected = selectedExistingAssetIds.includes(asset.id)

                return (
                  <Chip
                    key={asset.id}
                    label={asset.name}
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    onClick={() =>
                      setSelectedExistingAssetIds((currentIds) =>
                        currentIds.includes(asset.id)
                          ? currentIds.filter((id) => id !== asset.id)
                          : [...currentIds, asset.id],
                      )
                    }
                  />
                )
              })}
            </Stack>
          </Stack>
        ) : (
          <Alert severity="info">
            No hay assets existentes para este tipo.
          </Alert>
        )}
        <Button variant="outlined" component="label">
          Seleccionar imagenes o assets
          <input
            hidden
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.gif,.svg"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const files = Array.from(event.target.files ?? [])
              updateFormField('files', files)
              setUploadedAssets([])
              setAssetUploadError(null)
            }}
          />
        </Button>
        {form.files.length > 0 && (
          <Alert severity="info">
            Archivos seleccionados: {form.files.map((file) => file.name).join(', ')}
          </Alert>
        )}
        {uploadedAssets.length > 0 && (
          <Alert severity="success">
            Assets cargados: {uploadedAssets.map((asset) => asset.name).join(', ')}
          </Alert>
        )}
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="h6">Contexto adicional</Typography>
        {visibleGenerationFields.has("additionalContext") && (
          <TextField
            label="Notas adicionales"
            value={form.additionalContext}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateFormField("additionalContext", e.target.value)
            }
            multiline
            minRows={3}
            fullWidth
          />
        )}
      </Stack>

      <Button
        variant="contained"
        disabled={context.isGenerating}
        onClick={() => void submitGenerationForm()}
      >
        {context.isGenerating || isUploadingAssets ? "Generando..." : "Generar"}
      </Button>
      <Button variant="outlined" color="error" onClick={context.onCancel}>
        Cancelar
      </Button>
    </Stack>
  );
}

function EditForm({
  context,
  selectedBlock,
  submitLabel,
  onSubmit,
}: {
  context: CreatePageContext
  selectedBlock: NewsletterBlock
  submitLabel: string
  onSubmit: () => void
}) {
  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">{selectedBlock.name}</Typography>
      {context.aiError && <Alert severity="error">{context.aiError}</Alert>}
      <TextField
        label="Texto"
        value={selectedBlock.text}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          context.onUpdateBlockText(selectedBlock.id, e.target.value)
        }
        multiline
        minRows={3}
        fullWidth
      />
      <TextField
        label="Fondo"
        type="color"
        value={selectedBlock.backgroundColor}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          context.onUpdateBlockBackground(selectedBlock.id, e.target.value)
        }
        fullWidth
      />

      {/* ⚠️ ARREGLAR ⚠️ — mejorar con IA desactivado */}
      <Button variant="outlined" color="secondary" disabled>
        Mejorar con IA (desactivado)
      </Button>

      {!emptyComment(context.newsletterComment) && (
        <Alert severity="info">{context.newsletterComment}</Alert>
      )}

      <Divider />

      <Button
        variant="contained"
        onClick={onSubmit}
        disabled={context.isSendingForReview}
      >
        {context.isSendingForReview ? 'Enviando...' : submitLabel}
      </Button>
      <Button variant="outlined" color="error" onClick={context.onCancel} disabled={context.isSendingForReview}>
        Cancelar
      </Button>
    </Stack>
  )
}

function ReviewPreviewPane({ context }: PaneProps) {
  if (!['ADMIN', 'FUNCTIONAL'].includes(context.currentUserRole)) {
    return <PermissionDeniedPane />
  }
  return <BlockList context={context} />
}

function ReviewActionPane({ context }: PaneProps) {
  const selectedBlock = selectedBlockFrom(context)
  if (!['ADMIN', 'FUNCTIONAL'].includes(context.currentUserRole)) {
    return <PermissionDeniedPane />
  }
  return <ReviewCommentControls key={selectedBlock.id} context={context} selectedBlock={selectedBlock} />
}

function ReviewCommentControls({
  context,
  selectedBlock,
}: {
  context: CreatePageContext
  selectedBlock: NewsletterBlock
}) {
  const [newsletterComment, setNewsletterComment] = useState(context.newsletterComment ?? '')
  const [blockComment, setBlockComment] = useState(selectedBlock.comment ?? '')

  return (
    <Stack spacing={2}>
      <Tabs value={0}>
        <Tab label="Revision" />
      </Tabs>
      <TextField
        label="Comentario del newsletter"
        value={newsletterComment}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewsletterComment(e.target.value)}
        multiline
        minRows={3}
        fullWidth
      />
      <Button variant="outlined" onClick={() => context.onSaveNewsletterComment(newsletterComment)}>
        Guardar comentario general
      </Button>
      <Divider />
      <Typography variant="subtitle1">Comentario para {selectedBlock.name}</Typography>
      <TextField
        label="Comentario del bloque"
        value={blockComment}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setBlockComment(e.target.value)}
        multiline
        minRows={3}
        fullWidth
      />
      <Button variant="outlined" onClick={() => context.onSaveBlockComment(selectedBlock.id, blockComment)}>
        Guardar comentario del bloque
      </Button>
      <Divider />
      <Button variant="outlined" color="warning" onClick={context.onSendFeedback}>Enviar feedback</Button>
      <Button variant="contained" color="success" onClick={context.onApprove}>Aprobar</Button>
    </Stack>
  )
}

function ChangesPreviewPane({ context }: PaneProps) {
  if (context.currentUserId !== context.creatorUserId) return <PermissionDeniedPane />
  return <BlockList context={context} />
}

function ChangesActionPane({ context }: PaneProps) {
  const selectedBlock = selectedBlockFrom(context)
  if (context.currentUserId !== context.creatorUserId) return <PermissionDeniedPane />
  return (
    <Stack spacing={2}>
      <Tabs value={0}><Tab label="Editar" /></Tabs>
      <EditForm
        context={context}
        selectedBlock={selectedBlock}
        submitLabel="Reenviar a revision"
        onSubmit={context.onResendForReview}
      />
    </Stack>
  )
}

function ApprovedPreviewPane({ context }: PaneProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Vista final</Typography>
      {context.isRenderingHtml && <Alert severity="info">Preparando HTML aprobado...</Alert>}
      <Box
        component="iframe"
        title="Newsletter aprobado"
        srcDoc={context.renderedHtml || fallbackRenderedHtml}
        sx={{
          width: '100%',
          height: 'calc(100vh - 220px)',
          minHeight: 520,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          pointerEvents: 'none',
        }}
      />
    </Stack>
  )
}

function ApprovedActionPane({ context }: PaneProps) {
  return (
    <Stack spacing={2}>
      <Tabs value={0}><Tab label="Exportar" /></Tabs>
      <Typography variant="h5">Listo para publicacion</Typography>
      <Typography variant="body2" color="text.secondary">
        El newsletter aprobado ya esta renderizado y disponible para exportar.
      </Typography>
      {context.exportOptions.map((option) => (
        <Button
          key={option.id}
          variant="contained"
          disabled={context.isExportingPng}
          onClick={() => { if (option.format === 'PNG') void context.onExportToPng() }}
        >
          {context.isExportingPng ? 'Exportando...' : option.label}
        </Button>
      ))}
    </Stack>
  )
}

function DiscardedPreviewPane() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Proceso descartado</Typography>
      <Alert severity="info">
        La generacion del newsletter fue cancelada y quedo archivada como descartada.
      </Alert>
    </Stack>
  )
}

function DiscardedActionPane() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Detalle archivado</Typography>
      <Typography variant="body2" color="text.secondary">
        No hay acciones disponibles para un newsletter descartado.
      </Typography>
    </Stack>
  )
}

const newsletterStateMap: Record<NewsletterState, StatePaneConfig> = {
  DRAFT: { PreviewPane: DraftPreviewPane, ActionPane: DraftActionPane },
  IN_REVIEW: { PreviewPane: ReviewPreviewPane, ActionPane: ReviewActionPane },
  CHANGES_REQUESTED: { PreviewPane: ChangesPreviewPane, ActionPane: ChangesActionPane },
  RESUBMITTED: { PreviewPane: ReviewPreviewPane, ActionPane: ReviewActionPane },
  APPROVED: { PreviewPane: ApprovedPreviewPane, ActionPane: ApprovedActionPane },
  DISCARDED: { PreviewPane: DiscardedPreviewPane, ActionPane: DiscardedActionPane },
}

function CreatePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const currentUserId = user?.id ?? 'anonymous'
  const currentUserRole = user?.role ?? 'USER'
  const newsletterId = '65eb876f-994a-472a-95ab-00f453a84c50'
  const creatorUserId = '3'

  const [newsletterState, setNewsletterState] = useState<NewsletterState>('DRAFT')
  const [isGenerated, setIsGenerated] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0].id)
  const [blocks, setBlocks] = useState<NewsletterBlock[]>(initialBlocks)
  const [selectedBlockId, setSelectedBlockId] = useState(initialBlocks[0].id)
  const [newsletterComment, setNewsletterComment] = useState<string | null>(null)
  const [renderedHtml, setRenderedHtml] = useState('')
  const [exportOptions, setExportOptions] = useState<ExportOption[]>([])
  const [isRenderingHtml, setIsRenderingHtml] = useState(false)
  const [isExportingPng, setIsExportingPng] = useState(false)
  //const [improvingBlockId, setImprovingBlockId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSendingForReview, setIsSendingForReview] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const allCommentaries = useMemo(
    () =>
      [newsletterComment, ...blocks.map((block) => block.comment)].filter(
        (commentary): commentary is string => !emptyComment(commentary),
      ),
    [blocks, newsletterComment],
  )

  const transitionNewsletterState = useCallback(
    (newState: NewsletterState): void => {
      setNewsletterState((previousState) => {
        if (previousState === newState) return previousState
        logStateChange({
          newsletter_id: newsletterId,
          previous_state: previousState,
          new_state: newState,
          reviewed_by_user_id: currentUserId,
          all_commentaries: allCommentaries,
          created_at: new Date().toISOString(),
        })
        return newState
      })
    },
    [allCommentaries, currentUserId, newsletterId],
  )

  // ⚠️ ARREGLAR ⚠️ — reemplazar este mock por la llamada real a la IA cuando el servicio ande:
  //
  // const handleGenerate = useCallback(async (request: GenerateNewsletterRequest) => {
  //   setIsGenerating(true)
  //   setAiError(null)
  //   try {
  //     const response = await generateNewsletterWithAi(request)
  //     setBlocks(response.blocks.map((block) => ({ ...block, comment: null })))
  //     setSelectedBlockId(response.blocks[0]?.id ?? initialBlocks[0].id)
  //     setIsGenerated(true)
  //   } catch (error) {
  //     const fallbackMessage = 'No se pudo generar el newsletter en este momento.'
  //     setAiError(axios.isAxiosError(error) ? error.response?.data?.message ?? fallbackMessage : fallbackMessage)
  //   } finally {
  //     setIsGenerating(false)
  //   }
  // }, [])
  const handleGenerate = useCallback(async (request: GenerateNewsletterRequest) => {
    setIsGenerating(true)
    setAiError(null)
    await new Promise<void>((resolve) => window.setTimeout(resolve, 400)) // simula latencia
    const mockBlocks = buildMockBlocks(request)
    setBlocks(mockBlocks)
    setSelectedBlockId(mockBlocks[0].id)
    setIsGenerated(true)
    setIsGenerating(false)
  }, [])

  const handleRenderHtml = useCallback(async () => {
    setIsRenderingHtml(true)
    try {
      setRenderedHtml(await renderNewsletterHtml(blocks))
    } finally {
      setIsRenderingHtml(false)
    }
  }, [blocks])

  const handleSendForReview = useCallback(async () => {
    setIsSendingForReview(true)
    try {
      // ⚠️ ARREGLAR ⚠️ — reemplazar por la llamada real cuando la auth esté implementada:
      // await updateNewsletterStatus(newsletterId, 'IN_REVIEW')
      await new Promise<void>((resolve) => window.setTimeout(resolve, 400))
      await handleRenderHtml()
      transitionNewsletterState('IN_REVIEW')
      setShowSuccessModal(true)
    } catch {
      setAiError('No se pudo enviar a revisión en este momento. Intenta de nuevo.')
    } finally {
      setIsSendingForReview(false)
    }
  }, [handleRenderHtml, transitionNewsletterState])

  const handleCancel = useCallback(() => {
    transitionNewsletterState('DISCARDED')
    navigate('/dashboard')
  }, [navigate, transitionNewsletterState])

  const handleSendFeedback = useCallback(() => {
    transitionNewsletterState('CHANGES_REQUESTED')
    if (currentUserId !== creatorUserId) navigate('/dashboard')
  }, [creatorUserId, currentUserId, navigate, transitionNewsletterState])

  const handleExportToPng = useCallback(async () => {
    setIsExportingPng(true)
    try {
      await exportHtmlToPng()
    } finally {
      setIsExportingPng(false)
    }
  }, [])

  //  ARREGLAR  — mejorar con IA desactivado, reemplazar por la llamada real:
  //
  // const handleImproveBlockText = useCallback(async (blockId: string) => {
  //   const targetBlock = blocks.find((block) => block.id === blockId)
  //   if (!targetBlock) return
  //   setImprovingBlockId(blockId)
  //   setAiError(null)
  //   try {
  //     const response = await improveText({ text: targetBlock.text })
  //     setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, text: response.improvedText } : b))
  //   } catch (error) {
  //     setAiError('No se pudo mejorar el texto en este momento.')
  //   } finally {
  //     setImprovingBlockId(null)
  //   }
  // }, [blocks])
  const handleImproveBlockText = useCallback(async () => {
    // no-op mientras la IA no esté disponible / dentro de async: _blockId: string
  }, [])

  useEffect(() => {
    if (newsletterState !== 'APPROVED') return undefined
    const renderTimeoutId = window.setTimeout(() => { void handleRenderHtml() }, 0)
    void fetchExportOptions().then(setExportOptions)
    return () => { window.clearTimeout(renderTimeoutId) }
  }, [handleRenderHtml, newsletterState])

  const context = useMemo<CreatePageContext>(
    () => ({
      newsletterId,
      creatorUserId,
      currentUserId,
      currentUserRole,
      newsletterState,
      isGenerated,
      templates,
      selectedTemplateId,
      blocks,
      selectedBlockId,
      newsletterComment,
      renderedHtml,
      exportOptions,
      isRenderingHtml,
      isExportingPng,
      //improvingBlockId,
      isGenerating,
      isSendingForReview,
      aiError,
      onGenerate: handleGenerate,
      onResetGeneration: () => setIsGenerated(false),
      onSelectTemplate: setSelectedTemplateId,
      onCancel: handleCancel,
      onSendForReview: handleSendForReview,
      onSendFeedback: handleSendFeedback,
      onApprove: () => transitionNewsletterState('APPROVED'),
      onResendForReview: () => transitionNewsletterState('RESUBMITTED'),
      onSelectBlock: setSelectedBlockId,
      onUpdateBlockText: (blockId, value) =>
        setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, text: value } : b)),
      onUpdateBlockBackground: (blockId, value) =>
        setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, backgroundColor: value } : b)),
      onRegenerateBlockText: handleImproveBlockText,
      onSaveNewsletterComment: (value) => setNewsletterComment(value.trim() || null),
      onSaveBlockComment: (blockId, value) =>
        setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, comment: value.trim() || null } : b)),
      onExportToPng: handleExportToPng,
    }),
    [
      aiError,
      blocks,
      currentUserId,
      currentUserRole,
      exportOptions,
      handleCancel,
      handleExportToPng,
      handleGenerate,
      handleImproveBlockText,
      handleSendForReview,
      handleSendFeedback,
      //improvingBlockId,
      isSendingForReview,
      isExportingPng,
      isGenerated,
      isGenerating,
      isRenderingHtml,
      newsletterComment,
      newsletterState,
      renderedHtml,
      selectedBlockId,
      selectedTemplateId,
      transitionNewsletterState,
    ],
  )

  const handleCreateAnother = () => {
    setShowSuccessModal(false)
    setNewsletterState('DRAFT')
    setIsGenerated(false)
    setBlocks(initialBlocks)
    setSelectedBlockId(initialBlocks[0].id)
    setNewsletterComment(null)
    setRenderedHtml('')
    setAiError(null)
  }

  const { PreviewPane, ActionPane } = newsletterStateMap[newsletterState]

  return (
    <Box
      component="main"
      sx={{
        minHeight: 'calc(100vh - 64px)',
        bgcolor: 'background.default',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(380px, 0.72fr)' },
      }}
    >
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          borderRight: { lg: '1px solid' },
          borderBottom: { xs: '1px solid', lg: 'none' },
          borderColor: 'divider',
          minWidth: 0,
        }}
      >
        <PreviewPane context={context} />
      </Box>

      <Box sx={{ p: { xs: 2, md: 3 }, minWidth: 0 }}>
        <Stack spacing={2}>
          <Stack spacing={0.75}>
            <Typography variant="overline">Estado: {newsletterState}</Typography>
            <Typography variant="h4">Builder de newsletter</Typography>
          </Stack>
          <ActionPane context={context} />
        </Stack>
      </Box>

      <Dialog open={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <DialogTitle>Newsletter enviado a revisión</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tu newsletter fue enviado correctamente. ¿Qué querés hacer ahora?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/dashboard')} color="inherit">
            Ir al inicio
          </Button>
          <Button onClick={handleCreateAnother} variant="contained">
            Crear otro
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CreatePage
