import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { TemplateCarousel } from '../components/newsletter/TemplateCarousel'
import { GenerationForm } from '../components/newsletter/GenerationForm'
import {
  generateNewsletter,
  type GenerateNewsletterRequest,
} from '../api/ai'
import type {
  NewsletterAssetSelection,
  NewsletterBlock,
  NewsletterTemplate,
} from '../types/newsletter'
import { createNewsletter } from '../api/newsletters'
import { listTemplates } from '../api/templates'

// Mocks hardcodeados
/*function buildMockBlocks(request: GenerateNewsletterRequest): NewsletterBlock[] {
  return [
    { id: 'header',   name: 'Encabezado',           text: request.topic,                             backgroundColor: '#FFFFFF', comment: null },
    { id: 'headline', name: 'Titulo principal',      text: request.objective,                         backgroundColor: '#97CAEB', comment: null },
    { id: 'body',     name: 'Cuerpo',                text: request.keyMessages.join(' · '),           backgroundColor: '#FFFFFF', comment: null },
    { id: 'cta',      name: 'Llamado a la accion',   text: request.cta ?? 'Conoce mas en el portal interno.', backgroundColor: '#FFC600', comment: null },
  ]
}*/

function CreateNewsletterPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const currentUserId = user?.id ?? 'anonymous'

  const [templates, setTemplates] = useState<NewsletterTemplate[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [templatesError, setTemplatesError] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedBrandKitId, setSelectedBrandKitId] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadTemplates = async () => {
      setIsLoadingTemplates(true)
      setTemplatesError(null)

      try {
        const data = await listTemplates()
        if (mounted) {
          setTemplates(data)
          setSelectedTemplateId((current) => current || data[0]?.id || '')
        }
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

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null

  const handleGenerate = useCallback(
    async (
      request: GenerateNewsletterRequest,
      assetSelection: NewsletterAssetSelection,
    ) => {
      setIsGenerating(true)
      setAiError(null)

      try {
        // 1. Generar bloques con IA
        const response = await generateNewsletter(request)

        const blocks: NewsletterBlock[] = response.blocks.map((block) => ({
          id: block.id,
          name: block.name,
          text: block.text,
          backgroundColor: block.backgroundColor,
          comment: null,
        }))

        // 2. Crear newsletter en el backend con ID único
        const newsletter = await createNewsletter({
          creatorUserId: currentUserId,
          templateId: request.templateId,
          brandKitId: request.brandKitId,
          blocks,
          generationRequest: request,
          assetSelection,
        })

        // 3. Navegar a EditNewsletterPage con el ID
        navigate(`/editarNewsletter/${newsletter.id}`)
      } catch (error) {
        console.error('Error al generar newsletter:', error)
        setAiError('No se pudo generar el newsletter en este momento.')
      } finally {
        setIsGenerating(false)
      }
    },
    [currentUserId, navigate],
  )

  if (isLoadingTemplates) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

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
        <TemplateCarousel
          templates={templates}
          selectedBrandKitId={selectedBrandKitId}
          onSelectTemplate={setSelectedTemplateId}
          onSelectBrandKit={setSelectedBrandKitId}
        />
      </Box>

      <Box sx={{ p: { xs: 2, md: 3 }, minWidth: 0 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Crear newsletter</Typography>
          {templatesError && <Alert severity="error">{templatesError}</Alert>}
          {!templatesError && templates.length === 0 && (
            <Alert severity="info">No hay plantillas disponibles en este momento.</Alert>
          )}
          {selectedTemplate && selectedBrandKitId && (
            <GenerationForm
              selectedTemplate={selectedTemplate}
              selectedBrandKitId={selectedBrandKitId}
              isGenerating={isGenerating}
              aiError={aiError}
              onGenerate={handleGenerate}
              onCancel={() => navigate('/dashboard')}
            />
          )}
        </Stack>
      </Box>
    </Box>
  )
}

export default CreateNewsletterPage