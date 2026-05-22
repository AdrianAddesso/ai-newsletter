import { useCallback,useEffect,useMemo,useState } from 'react'
import { useNavigate,useParams } from 'react-router'

import { useAuth } from '../../../contexts/AuthContext'
import { useNotification } from '../../../hooks/useNotification'

import { getNewsletter,updateNewsletter } from '../../../api/newsletters'
import { listTemplates } from '../../../api/templates'
import { listBrandKits,getBrandKitResources } from '../../../api/brand-kits'
import { improveText,generateNewsletter } from '../../../api/ai'

import type {
  Newsletter,
  NewsletterBlock,
  NewsletterState,
  NewsletterTemplate,
  NewsletterAssetSelection,
  ExportFormat,
  ExportOption,
} from '../../../types/newsletter'

import type {
  BrandKit,
  BrandKitResources,
} from '../../../api/brand-kits'

import type {
  GenerateNewsletterRequest,
} from '../../../api/ai'

export function useNewsletterEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { success } = useNotification()

  const [newsletter,setNewsletter] = useState<Newsletter | null>(null)
  const [isLoading,setIsLoading] = useState(true)
  const [error,setError] = useState<string | null>(null)
  const [selectedBlockId,setSelectedBlockId] = useState('')
  const [showRegenerationForm,setShowRegenerationForm] = useState(false)

  const [templates,setTemplates] = useState<NewsletterTemplate[]>([])
  const [brandKits,setBrandKits] = useState<BrandKit[]>([])
  const [brandKitResources,setBrandKitResources] =
    useState<BrandKitResources | null>(null)

  const [exportingFormat,setExportingFormat] =
    useState<ExportFormat | null>(null)

  const exportOptions: ExportOption[] = [
    {
      id:'png',
      label:'Exportar PNG',
      format:'PNG',
    },
    {
      id:'pdf',
      label:'Exportar PDF',
      format:'PDF' as ExportFormat,
    },
    {
      id:'eml',
      label:'Exportar EML',
      format:'EML',
    },
  ]

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        const data = await getNewsletter(id)

        setNewsletter(data)
        setSelectedBlockId(data.blocks?.[0]?.id ?? '')

        const [templateData,brandKitData] = await Promise.all([
          listTemplates(),
          listBrandKits(),
        ])

        setTemplates(templateData)
        setBrandKits(brandKitData)

        if (data.brandKitId) {
          const resources =
            await getBrandKitResources(data.brandKitId)

          setBrandKitResources(resources)
        }
      } catch {
        setError('No se pudo cargar el newsletter')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [id])

  const selectedBlock = useMemo(() => {
    return newsletter?.blocks.find(
      b => b.id === selectedBlockId,
    )
  }, [newsletter,selectedBlockId])

  const renderHtml = useCallback(() => {
    if (!newsletter) return ''

    return `
      <!doctype html>
      <html>
        <body style="font-family:Arial,sans-serif">
          ${newsletter.blocks.map(block => `
            <section style="padding:24px;background:${block.backgroundColor}">
              <h2>${block.name}</h2>
              <p>${block.text}</p>
            </section>
          `).join('')}
        </body>
      </html>
    `
  }, [newsletter])

  const updateBlocks = useCallback((blocks: NewsletterBlock[]) => {
    if (!newsletter) return

    setNewsletter({
      ...newsletter,
      blocks,
    })
  }, [newsletter])

  const transitionState = useCallback(async (state: NewsletterState) => {
    if (!id || !newsletter) return

    const updated = await updateNewsletter(id,{
      blocks: newsletter.blocks,
      state,
    })

    setNewsletter(updated)
  }, [id,newsletter])

  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!newsletter) return

    setExportingFormat(format)

    try {
      const html =
        newsletter.renderedHtml ??
        renderHtml()

      switch (format) {
        case 'EML': {
          const emlContent = [
            'X-Unsent: 1',
            'To: ',
            'Subject: Newsletter Nestlé',
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            '',
            html,
          ].join('\r\n')

          const blob = new Blob(
            [emlContent],
            {
              type:'message/rfc822',
            },
          )

          const url = URL.createObjectURL(blob)

          const a = document.createElement('a')

          a.href = url
          a.download = 'newsletter.eml'

          document.body.appendChild(a)

          a.click()

          document.body.removeChild(a)

          URL.revokeObjectURL(url)

          break
        }

        case 'PNG':
        case 'PDF': {
          const container =
            document.createElement('div')

          container.innerHTML = html

          container.style.position = 'fixed'
          container.style.left = '-99999px'
          container.style.top = '0'
          container.style.width = '1200px'
          container.style.background = '#fff'

          document.body.appendChild(container)

          const html2canvas =
            (await import('html2canvas')).default

          const canvas =
            await html2canvas(container,{
              scale:2,
              useCORS:true,
              backgroundColor:'#ffffff',
            })

          document.body.removeChild(container)

          if (format === 'PNG') {
            const image =
              canvas.toDataURL('image/png')

            const link =
              document.createElement('a')

            link.href = image
            link.download = 'newsletter.png'

            link.click()

            break
          }

          const { jsPDF } =
            await import('jspdf')

          const pdf =
            new jsPDF({
              orientation:'portrait',
              unit:'px',
              format:[
                canvas.width,
                canvas.height,
              ],
            })

          const image =
            canvas.toDataURL('image/png')

          pdf.addImage(
            image,
            'PNG',
            0,
            0,
            canvas.width,
            canvas.height,
          )

          pdf.save('newsletter.pdf')

          break
        }
      }
    } finally {
      setExportingFormat(null)
    }
  }, [newsletter,renderHtml])

  const handleRegenerateBlock = useCallback(async (blockId: string) => {
    if (!newsletter) return

    const target = newsletter.blocks.find(
      b => b.id === blockId,
    )

    if (!target) return

    const response = await improveText({
      text: target.text,
    })

    updateBlocks(
      newsletter.blocks.map(b =>
        b.id === blockId
          ? {
              ...b,
              text: response.improvedText,
            }
          : b,
      ),
    )
  }, [newsletter,updateBlocks])

  const handleGenerateAll = useCallback(
    async (
      request: GenerateNewsletterRequest,
      assetSelection: NewsletterAssetSelection,
    ) => {
      if (!id) return

      const response = await generateNewsletter(request)

      const blocks = response.blocks.map(block => ({
        id:block.id,
        name:block.name,
        text:block.text,
        backgroundColor:block.backgroundColor,
        comment:null,
      }))

      const updated = await updateNewsletter(id,{
        blocks,
        generationRequest:request,
        assetSelection,
      })

      setNewsletter(updated)

      setSelectedBlockId(blocks[0]?.id ?? '')

      setShowRegenerationForm(false)
    },
    [id],
  )

  const handleSubmit = useCallback(async () => {
    await transitionState('IN_REVIEW')

    success('Newsletter enviado')

    navigate('/dashboard')
  }, [navigate,success,transitionState])

  return {
    newsletter,
    setNewsletter,
    isLoading,
    error,
    selectedBlock,
    selectedBlockId,
    setSelectedBlockId,
    showRegenerationForm,
    setShowRegenerationForm,
    templates,
    brandKits,
    brandKitResources,
    exportOptions,
    exportingFormat,
    updateBlocks,
    transitionState,
    handleExport,
    handleSubmit,
    handleRegenerateBlock,
    handleGenerateAll,
    currentUserRole:user?.role ?? 'USER',
    currentUserId:user?.id ?? '',
    navigate,
    isApproved:newsletter?.state === 'APPROVED',
    isReviewState:
      newsletter?.state === 'IN_REVIEW' ||
      newsletter?.state === 'RESUBMITTED',
  }
}