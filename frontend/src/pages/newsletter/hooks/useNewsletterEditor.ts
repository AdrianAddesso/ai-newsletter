import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useAuth } from '../../../contexts/AuthContext'
import { useNotification } from '../../../hooks/useNotification'

import {
  getNewsletter,
  updateNewsletter,
  updateNewsletterStatus,
} from '../../../api/newsletters'
import { listTemplates } from '../../../api/templates'
import { getBrandKitResources, listBrandKits } from '../../../api/brand-kits'
import { generateNewsletter, improveText } from '../../../api/ai'

import type {
  BlockReviewComment,
  Newsletter,
  NewsletterBlock,
  NewsletterState,
  NewsletterTemplate,
  ExportFormat,
  ExportOption,
} from '../../../types/newsletter'

import type { BrandKit, BrandKitResources } from '../../../api/brand-kits'

import type { GenerateNewsletterRequest } from '../../../api/ai'
import { updateBlockValue } from '../../../utils/newsletterBlocks'

const waitForExportRender = async (): Promise<void> => {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready
  }

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

const captureExportCanvas = async (): Promise<{
  canvas: HTMLCanvasElement
  width: number
  height: number
}> => {
  const exportRoot = document.querySelector<HTMLElement>(
    '[data-newsletter-export-root]',
  )

  if (!exportRoot) {
    throw new Error('No se encontro el contenido visible para exportar')
  }

  await waitForExportRender()

  const html2canvas = (await import('html2canvas')).default
  const { width, height } = exportRoot.getBoundingClientRect()
  const normalizedWidth = Math.ceil(width)
  const normalizedHeight = Math.ceil(height)

  const canvas = await html2canvas(exportRoot, {
    scale: Math.max(2, window.devicePixelRatio || 1),
    useCORS: true,
    backgroundColor: '#ffffff',
    width: normalizedWidth,
    height: normalizedHeight,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
    scrollX: 0,
    scrollY: -window.scrollY,
    onclone: (clonedDocument) => {
      const root = clonedDocument.querySelector<HTMLElement>(
        '[data-newsletter-export-root]',
      )

      if (!root) return

      root
        .querySelectorAll<HTMLElement>('.MuiTypography-root')
        .forEach((node) => {
          node.style.overflow = 'visible'
          node.style.lineHeight = node.style.lineHeight || '1.2'
        })
    },
  })

  return {
    canvas,
    width: normalizedWidth,
    height: normalizedHeight,
  }
}

export function useNewsletterEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { success } = useNotification()

  const [newsletter, setNewsletter] = useState<Newsletter | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBlockId, setSelectedBlockIdState] = useState('')
  const [showRegenerationForm, setShowRegenerationForm] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  const [templates, setTemplates] = useState<NewsletterTemplate[]>([])
  const [brandKits, setBrandKits] = useState<BrandKit[]>([])
  const [brandKitResources, setBrandKitResources] =
    useState<BrandKitResources | null>(null)

  const [exportingFormat, setExportingFormat] =
    useState<ExportFormat | null>(null)

  const exportOptions: ExportOption[] = [
    {
      id: 'jpg',
      label: 'Exportar JPG',
      format: 'JPG',
    },
    {
      id: 'pdf',
      label: 'Exportar PDF',
      format:'PDF' as ExportFormat,
    },
    {
      id: 'eml',
      label: 'Exportar EML',
      format: 'EML',
    },
  ]

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        const data = await getNewsletter(id)

        setNewsletter(data)
        setSelectedBlockIdState(data.blocks?.[0]?.id ?? '')

        const [templateData, brandKitData] = await Promise.all([
          listTemplates(),
          listBrandKits(),
        ])

        setTemplates(templateData)
        setBrandKits(brandKitData)

        if (data.brandKitId) {
          const resources = await getBrandKitResources(data.brandKitId)

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

  useEffect(() => {
    if (!brandKitResources?.fonts.length || typeof FontFace === 'undefined') {
      return
    }

    let cancelled = false

    const loadFonts = async (): Promise<void> => {
      await Promise.all(
        brandKitResources.fonts.map(async (font) => {
          try {
            const fontFace = new FontFace(font.name, `url(${font.url})`)
            const loadedFontFace = await fontFace.load()

            if (!cancelled) {
              document.fonts.add(loadedFontFace)
            }
          } catch {
            return
          }
        }),
      )
    }

    void loadFonts()

    return () => {
      cancelled = true
    }
  }, [brandKitResources])

  const selectedBlock = useMemo(() => {
    return newsletter?.blocks.find(
      (block) => block.id === selectedBlockId,
    )
  }, [newsletter, selectedBlockId])

  const selectedBlockReviewHistory = useMemo((): BlockReviewComment[] => {
    if (!newsletter || !selectedBlockId) {
      return []
    }

    return newsletter.reviewRounds
      .flatMap((reviewRound) => reviewRound.comments)
      .filter((comment) => comment.blockId === selectedBlockId)
      .sort((a, b) => (
        new Date(b.commentedAt).getTime() - new Date(a.commentedAt).getTime()
      ))
  }, [newsletter, selectedBlockId])

  const selectedTemplate = useMemo(() => {
    if (!newsletter) return undefined

    return templates.find((template) => template.id === newsletter.templateId)
  }, [newsletter, templates])

  const updateBlocks = useCallback((blocks: NewsletterBlock[]) => {
    if (!newsletter) return

    setNewsletter({
      ...newsletter,
      blocks,
    })
  }, [newsletter])

  const saveDraft = useCallback(async () => {
    if (!id || !newsletter) return

    setIsSavingDraft(true)

    try {
      const updated = await updateNewsletter(id, {
        blocks: newsletter.blocks,
        state: 'DRAFT',
      })

      setNewsletter(updated)
      setSelectedBlockIdState((current) =>
        updated.blocks.some((block) => block.id === current)
          ? current
          : (updated.blocks[0]?.id ?? ''),
      )
      success('Borrador guardado')
    } finally {
      setIsSavingDraft(false)
    }
  }, [id,newsletter,success])

  const transitionState = useCallback(
    async (state: NewsletterState) => {
      if (!id || !newsletter) return

      await updateNewsletter(id, { blocks: newsletter.blocks })
      const updated = await updateNewsletterStatus(id, state)

      setNewsletter(updated)
    },
    [id, newsletter],
  )

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!newsletter) return

      setExportingFormat(format)

      try {
        switch (format) {
          case 'EML': {
            const { canvas, width } = await captureExportCanvas()
            const imageData = canvas.toDataURL('image/png')
            const html = `
              <!doctype html>
              <html>
                <body style="margin:0;padding:0;background:#ffffff;">
                  <img
                    src="${imageData}"
                    alt="Newsletter"
                    width="${width}"
                    style="display:block;width:100%;max-width:${width}px;height:auto;border:0;outline:none;text-decoration:none;"
                  />
                </body>
              </html>
            `
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

            const blob = new Blob([emlContent], {
              type: 'message/rfc822',
            })

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

          case 'JPG':
          case 'PDF': {
            const { canvas, width, height } = await captureExportCanvas()

            if (format === 'JPG') {
              const image = canvas.toDataURL('image/jpeg', 0.92)

              const link = document.createElement('a')

              link.href = image
              link.download = 'newsletter.jpg'

              link.click()

              break
            }

            const { jsPDF } = await import('jspdf')

            const pdf = new jsPDF({
              orientation: width >= height ? 'landscape' : 'portrait',
              unit: 'px',
              format: [width, height],
              hotfixes: ['px_scaling'],
            })

            const image = canvas.toDataURL('image/png')

            pdf.addImage(image, 'PNG', 0, 0, width, height)

            pdf.save('newsletter.pdf')

            break
          }
        }
      } finally {
        setExportingFormat(null)
      }
    },
    [newsletter],
  )

  const handleRegenerateBlock = useCallback(
    async (blockId: string) => {
      if (!newsletter) return

      const target = newsletter.blocks.find((block) => block.id === blockId)

      if (!target) return

      const editableTextField = target.editFields.find(
        (field) => field.type === 'text' || field.type === 'textarea',
      )

      if (!editableTextField) return

      const contentValues = parseContent<Record<string, string>>(target.content)
      const currentText = contentValues[editableTextField.key]?.trim()

      if (!currentText) {
        return
      }

      const response = await improveText({
        text: currentText,
      })

      updateBlocks(
        newsletter.blocks.map((block) =>
          block.id === blockId
            ? updateBlockValue(block, editableTextField.key, response.improvedText)
            : block,
        ),
      )
    },
    [newsletter, updateBlocks],
  )

  const handleGenerateAll = useCallback(
    async (request: GenerateNewsletterRequest) => {
      if (!id) return

      const response = await generateNewsletter(request)

      const updated = await updateNewsletter(id, {
        blocks: response.blocks,
        generationRequest: request,
        generationContent: {
          aiContent: response,
          originalContent: request,
        },
      })

      setNewsletter(updated)

      setSelectedBlockIdState(updated.blocks[0]?.id ?? '')

      setShowRegenerationForm(false)
    },
    [id],
  )

  const handleSubmit = useCallback(async () => {
    if (!newsletter) {
      return
    }

    const nextState: NewsletterState =
      newsletter.state === 'CHANGES_REQUESTED'
        ? 'RESUBMITTED'
        : 'IN_REVIEW'

    await transitionState(nextState)

    success('Newsletter enviado')

    navigate('/dashboard')
  }, [navigate, newsletter, success, transitionState])

  return {
    newsletter,
    setNewsletter,
    isLoading,
    error,
    selectedBlock,
    selectedBlockReviewHistory,
    selectedBlockId,
    setSelectedBlockId: setSelectedBlockIdState,
    showRegenerationForm,
    setShowRegenerationForm,
    templates,
    selectedTemplate,
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
    currentUserRole: user?.role ?? 'USER',
    currentUserId: user?.id ?? '',
    isSavingDraft,
    saveDraft,
    navigate,
    isApproved: newsletter?.state === 'APPROVED',
  }
}
