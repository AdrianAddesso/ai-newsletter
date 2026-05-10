import axios from 'axios'
import type { AreaName } from '../types/newsletter'

export type ImproveTextRequest = {
  text: string
}

export type ImproveTextResponse = {
  originalText: string
  improvedText: string
}

export type GeneratedNewsletterBlock = {
  id: string
  name: string
  text: string
  backgroundColor: string
}

export type GenerateNewsletterRequest = {
  area: AreaName
  templateId: string
  brandKitId: string
  topic: string
  objective: string
  audience: string
  keyMessages: string[]
  tone: string
  relevantDates?: string
  cta?: string
  contact?: string
  linksOrSources: string[]
  additionalContext?: string
  assetIds: string[]
}

export type GenerateNewsletterResponse = {
  blocks: GeneratedNewsletterBlock[]
}

export async function improveText(
  request: ImproveTextRequest,
): Promise<ImproveTextResponse> {
  const response = await axios.post<ImproveTextResponse>('/ai/improve-text', request)

  return response.data
}

export async function generateNewsletter(
  request: GenerateNewsletterRequest,
): Promise<GenerateNewsletterResponse> {
  const response = await axios.post<GenerateNewsletterResponse>(
    '/ai/generate-newsletter',
    request,
  )

  return response.data
}
