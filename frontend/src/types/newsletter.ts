import type { GenerateNewsletterRequest } from '../api/ai'
import type { UploadedAsset } from '../api/assets'
import type { UUID } from '../interfaces/interfaces.templates'

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
  name: string
  text: string
  backgroundColor: string
  comment: string | null
}

export type NewsletterAssetSelection = {
  selectedAssets: UploadedAsset[]
}

export type NewsletterTemplate = {
  id: string
  name: string
  description: string | null
  area: AreaName
  layout: string | null
  orientation: 'PORTRAIT' | 'LANDSCAPE'
  stateCode: string
  stateName: string
  createdAt: string
  requiredGenerationFields: TemplateGenerationField[]
  optionalGenerationFields: TemplateGenerationField[]
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
  assetSelection: NewsletterAssetSelection | null
  renderedHtml: string | null
  createdAt: string
  updatedAt: string
}

// Para crear un nuevo newsletter
export type CreateNewsletterPayload = {
  title?: string
  creatorUserId?: string
  templateId: string
  brandKitId: string
  blocks: NewsletterBlock[]
  generationRequest: GenerateNewsletterRequest
  assetSelection: NewsletterAssetSelection | null
}

// Para actualizar
export type UpdateNewsletterPayload = {
  templateId?: string
  brandKitId?: string
  blocks?: NewsletterBlock[]
  comment?: string | null
  state?: NewsletterState
  generationRequest?: GenerateNewsletterRequest | null
  assetSelection?: NewsletterAssetSelection | null
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
