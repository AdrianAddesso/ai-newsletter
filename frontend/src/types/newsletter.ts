import type { GenerateNewsletterRequest } from '../api/ai'
import type { UUID } from '../interfaces/interfaces.templates'
import type { BlockEditField, BlockAssetType } from '@shared/types/block.types'

export type NewsletterState =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'DISCARDED'

export type AreaName = 'COMUNICACION_INTERNA' | 'COMUNICACION_CORPORATIVA'
export type TemplateGenerationField =
  | 'relevantDates'
  | 'cta'
  | 'contact'
  | 'linksOrSources'
  | 'additionalContext'

export type NewsletterBlock = {
  id: string
  type: string
  category?: string
  name: string
  content: string | null
  row: number
  gridColumn: number
  displayOrder: number
  mustFill: boolean
  comment: string | null
  editFields: BlockEditField[]
  assetBindings: NewsletterBlockAssetBinding[]
}

export type NewsletterBlockAssetBinding = {
  fieldKey: string
  assetId: string
  assetName: string | null
  assetUrl: string | null
  assetType: BlockAssetType
  keywordText?: string | null
  svgTemplate?: string | null
  maxChars?: number | null
}

export type NewsletterTemplate = {
  id: string
  name: string
  description: string | null
  area: AreaName
  layout: TemplateLayoutBlock[] | null
  orientation: 'PORTRAIT' | 'LANDSCAPE'
  stateCode: string
  stateName: string
  createdAt: string
  requiredGenerationFields: TemplateGenerationField[]
  optionalGenerationFields: TemplateGenerationField[]
}

export type TemplateLayoutBlock = {
  type?: string | null
  block_type: string | null
  content: string | null
  row: number
  grid_column: number
  display_order: number
  mustFill?: boolean
}

export type ExportFormat =
  | 'PNG'
  | 'EML'
  | 'PDF'

export type ExportOption = {
  id: string
  label: string
  format: ExportFormat
}

// Modelo completo de Newsletter persistido
export type Newsletter = {
  id: string
  creatorUserId: string
  state: NewsletterState
  templateId: string
  brandKitId: string
  blocks: NewsletterBlock[]
  comment: string | null
  generationRequest: GenerateNewsletterRequest | null
  generationContent?: NewsletterGenerationContent | null
  renderedHtml: string | null
  createdAt: string
  updatedAt: string
}

export type NewsletterGenerationContent = {
  aiContent: unknown
  originalContent: GenerateNewsletterRequest
}

// Para crear un nuevo newsletter
export type CreateNewsletterPayload = {
  title?: string
  creatorUserId?: string
  templateId: string
  brandKitId: string
  blocks: NewsletterBlock[]
  generationRequest: GenerateNewsletterRequest
  generationContent: NewsletterGenerationContent
}

// Para actualizar
export type UpdateNewsletterPayload = {
  title?: string
  templateId?: string
  brandKitId?: string
  blocks?: NewsletterBlock[]
  comment?: string | null
  state?: NewsletterState
  generationRequest?: GenerateNewsletterRequest | null
  generationContent?: NewsletterGenerationContent | null
  renderedHtml?: string | null
}

export type RowType = {
    id: UUID;
    rowIndex: number,
}

export type ColumnType = {
    id: UUID,
    type: string | undefined | null,
    displayOrder: number
}
