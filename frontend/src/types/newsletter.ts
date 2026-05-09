import type { GenerateNewsletterRequest } from '../api/ai'

export type NewsletterState =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'DISCARDED'

export type AreaName = 'COMUNICACION_INTERNA' | 'COMUNICACION_CORPORATIVA'
export type BrandKitId = 'nestle-corporate' | 'nescafe' | 'kit-kat'
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

export type NewsletterTemplate = {
  id: string
  name: string
  imageUrl: string
  area: AreaName
  brandKitId: BrandKitId
  requiredGenerationFields: TemplateGenerationField[]
  optionalGenerationFields: TemplateGenerationField[]
}

export type ExportOption = {
  id: string
  label: string
  format: 'PNG'
}

// Modelo completo de Newsletter persistido
export type Newsletter = {
  id: string
  creatorUserId: string
  state: NewsletterState
  templateId: string
  blocks: NewsletterBlock[]
  comment: string | null
  generationRequest: GenerateNewsletterRequest | null
  renderedHtml: string | null
  createdAt: string
  updatedAt: string
}

// Para crear un nuevo newsletter
export type CreateNewsletterPayload = {
  creatorUserId: string
  templateId: string
  blocks: NewsletterBlock[]
  generationRequest: GenerateNewsletterRequest
}

// Para actualizar
export type UpdateNewsletterPayload = {
  blocks?: NewsletterBlock[]
  comment?: string | null
  state?: NewsletterState
  renderedHtml?: string | null
}