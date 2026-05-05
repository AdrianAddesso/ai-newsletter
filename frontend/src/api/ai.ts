import axios from 'axios'
import { apiBaseUrl } from '../config/api'

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
  area: 'COMUNICACION_INTERNA' | 'COMUNICACION_CORPORATIVA'
  templateId: string
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
  const response = await axios.post<ImproveTextResponse>(
    `${apiBaseUrl}/ai/improve-text`,
    request,
  )

  return response.data
}

export async function generateNewsletter(
  request: GenerateNewsletterRequest,
): Promise<GenerateNewsletterResponse> {
  const response = await axios.post<GenerateNewsletterResponse>(
    `${apiBaseUrl}/ai/generate-newsletter`,
    request,
  )

  return response.data
}
