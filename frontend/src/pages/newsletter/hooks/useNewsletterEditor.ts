import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { parseContent } from '../../../utils/blockContent'
import { useAuth } from '../../../contexts/AuthContext'
import { useNotification } from '../../../hooks/useNotification'

import {
  exportNewsletterEml,
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

function getPreferredRegenerationField(
  block: NewsletterBlock,
): NewsletterBlock['editFields'][number] | undefined {
  const priorityOrder = [
    'buttonLabel',
    'title',
    'subtitle',
    'topLabel',
    'introText',
    'primaryText',
    'bodyText',
    'text',
    'label',
    'secondaryText',
    'bottomLabel',
    'closingText',
    'altText',
  ]

  const textFields = block.editFields.filter(
    (field) =>
      (field.type === 'text' || field.type === 'textarea') &&
      field.key !== 'iconName',
  )

  if (textFields.length === 0) {
    return block.editFields.find(
      (field) => field.type === 'text' || field.type === 'textarea',
    )
  }

  return [...textFields].sort((left, right) => {
    const leftIndex = priorityOrder.indexOf(left.key)
    const rightIndex = priorityOrder.indexOf(right.key)

    return (leftIndex === -1 ? 999 : leftIndex) -
      (rightIndex === -1 ? 999 : rightIndex)
  })[0]
}

export function useNewsletterEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { success, error: notifyError } = useNotification()

  const [newsletter, setNewsletter] = useState<Newsletter | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBlockId, setSelectedBlockIdState] = useState('')
  const [showRegenerationForm, setShowRegenerationForm] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [regeneratingBlockId, setRegeneratingBlockId] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

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

    const escapeCssString = (value: string): string =>
    value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  const createExportFontStyle = (): HTMLStyleElement | null => {
    if (!brandKitResources?.fonts.length) {
      return null
    }

    const css = brandKitResources.fonts
      .map((font) => {
        const family = escapeCssString(font.name)
        const url = escapeCssString(font.url)

        return `
          @font-face {
            font-family: "${family}";
            src: url("${url}");
            font-display: swap;
          }
        `
      })
      .join('\n')

    const style = document.createElement('style')
    style.setAttribute('data-newsletter-export-fonts', 'true')
    style.textContent = css

    document.head.appendChild(style)

    return style
  }

  const getExportLinkAreas = (
  exportRoot: HTMLElement,
): Array<{
  href: string
  x: number
  y: number
  width: number
  height: number
}> => {
  const rootRect = exportRoot.getBoundingClientRect()

  const createLinkArea = (element: HTMLElement, href: string) => {
    const linkRect = element.getBoundingClientRect()

    return {
      href,
      x: linkRect.left - rootRect.left,
      y: linkRect.top - rootRect.top,
      width: linkRect.width,
      height: linkRect.height,
    }
  }

  const anchorLinkAreas = Array.from(
    exportRoot.querySelectorAll<HTMLAnchorElement>('a[href]'),
  )
    .filter((link) => Boolean(link.href))
    .map((link) => createLinkArea(link, link.href))

  const blockLinkAreas = Array.from(
    exportRoot.querySelectorAll<HTMLElement>('[data-newsletter-block-href]'),
  )
    .map((blockElement) => ({
      element: blockElement,
      href: blockElement.dataset.newsletterBlockHref?.trim() ?? '',
    }))
    .filter(({ href }) => Boolean(href))
    .map(({ element, href }) => createLinkArea(element, href))

  return [...anchorLinkAreas, ...blockLinkAreas]
}

  const baseExportBlockTypes = new Set(['ctaFull', 'ctaAlternative', 'empty'])

  const shouldSnapshotBlock = (blockType: string): boolean =>
    !baseExportBlockTypes.has(blockType)

  const buildNewsletterBlockSnapshots = async (
  exportRoot: HTMLElement,
  domToImage: typeof import('dom-to-image-more').default,
): Promise<Array<{ blockId: string; dataUrl: string; width: number; height: number }>> => {
  const blockElements = Array.from(
    exportRoot.querySelectorAll<HTMLElement>('[data-newsletter-block-id]'),
  )

  const snapshots: Array<{ blockId: string; dataUrl: string; width: number; height: number }> = []

  for (const blockElement of blockElements) {
    const blockId = blockElement.dataset.newsletterBlockId
    const blockType = blockElement.dataset.newsletterBlockType ?? ''

    if (!blockId || !shouldSnapshotBlock(blockType)) {
      continue
    }

    const { width, height } = blockElement.getBoundingClientRect()

    if (width <= 0 || height <= 0) {
      continue
    }

    const dataUrl = await domToImage.toPng(blockElement, {
      width,
      height,
      bgcolor: '#ffffff',
    })

    snapshots.push({
      blockId,
      dataUrl,
      width,
      height,
    })
  }

  return snapshots
}

  const downloadBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)
  }

  const handleExport = useCallback(
  async (format: ExportFormat) => {
    if (!newsletter) return

    setExportingFormat(format)

    const exportFontStyle = createExportFontStyle()

    try {
      const domToImage = (await import('dom-to-image-more')).default

      const exportRoot = document.querySelector<HTMLElement>(
        '[data-newsletter-export-root]',
      )

      if (!exportRoot) {
        throw new Error('No se encontro el contenido visible para exportar')
      }

      // Esperar fuentes y render
      if (document.fonts?.ready) await document.fonts.ready
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })

      const scale = Math.max(2, window.devicePixelRatio || 1)
      const { width, height } = exportRoot.getBoundingClientRect()
      const exportLinkAreas = getExportLinkAreas(exportRoot)

      switch (format) {
        case 'JPG': {
          const dataUrl = await domToImage.toJpeg(exportRoot, {
            quality: 0.92,
            width: width * scale,
            height: height * scale,
            style: { transform: `scale(${scale})`, transformOrigin: 'top left' },
            bgcolor: '#ffffff',
          })
          const link = document.createElement('a')
          link.href = dataUrl
          link.download = 'newsletter.jpg'
          link.click()
          break
        }

        case 'PDF': {
          const dataUrl = await domToImage.toPng(exportRoot, {
            width: width * scale,
            height: height * scale,
            style: { transform: `scale(${scale})`, transformOrigin: 'top left' },
            bgcolor: '#ffffff',
          })
          const { jsPDF } = await import('jspdf')
          const pdf = new jsPDF({
            orientation: width >= height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [width, height],
            hotfixes: ['px_scaling'],
          })
          pdf.addImage(dataUrl, 'PNG', 0, 0, width, height)

          exportLinkAreas.forEach((exportLinkArea) => {
            pdf.link(
            exportLinkArea.x,
            exportLinkArea.y,
            exportLinkArea.width,
            exportLinkArea.height,
              { url: exportLinkArea.href },
            )
          })

          pdf.save('newsletter.pdf')
          break
        }

        case 'EML': {
          const snapshots = await buildNewsletterBlockSnapshots(
            exportRoot,
            domToImage,
          )

          const blob = await exportNewsletterEml(newsletter.id, snapshots)

          downloadBlob(blob, 'newsletter.eml')
          break          
        }
      }
    } finally {
      exportFontStyle?.remove()
      setExportingFormat(null)
    }
  },
  [newsletter, brandKitResources],
)

  const handleRegenerateBlock = useCallback(
    async (blockId: string) => {
      if (!newsletter) return

      const target = newsletter.blocks.find((block) => block.id === blockId)

      if (!target) return

      const editableTextField = getPreferredRegenerationField(target)

      if (!editableTextField) return

      const contentValues = parseContent<Record<string, string>>(target.content)
      const currentText = contentValues[editableTextField.key]?.trim()

      if (!currentText) {
        return
      }

      setAiError(null)
      setRegeneratingBlockId(blockId)

      try {
        const response = await improveText(
          {
            text: currentText,
          },
          notifyError,
        )

        updateBlocks(
          newsletter.blocks.map((block) =>
            block.id === blockId
              ? updateBlockValue(block, editableTextField.key, response.improvedText)
              : block,
          ),
        )
      } catch (error) {
        const message =
          getApiErrorMessage(error) ??
          'No se pudo regenerar el contenido de este bloque.'

        setAiError(message)
      } finally {
        setRegeneratingBlockId(null)
      }
    },
    [newsletter, notifyError, updateBlocks],
  )

  const handleGenerateAll = useCallback(
    async (request: GenerateNewsletterRequest) => {
      if (!id) return

      setAiError(null)
      setIsGeneratingAll(true)

      try {
        const response = await generateNewsletter(request, notifyError)

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
      } catch (error) {
        const message =
          getApiErrorMessage(error) ??
          'No se pudo generar el contenido del newsletter en este momento.'

        setAiError(message)
      } finally {
        setIsGeneratingAll(false)
      }
    },
    [id, notifyError],
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
    isGeneratingAll,
    regeneratingBlockId,
    aiError,
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

function getApiErrorMessage(error: unknown): string | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = error.response

    if (
      typeof response === 'object' &&
      response !== null &&
      'data' in response
    ) {
      const data = response.data

      if (
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof data.message === 'string' &&
        data.message.trim()
      ) {
        return data.message.trim()
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  return null
}
