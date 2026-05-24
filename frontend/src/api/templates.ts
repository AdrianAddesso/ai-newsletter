import axios from 'axios'
import type {
  NewsletterTemplate,
  TemplateGenerationField,
  TemplateLayoutBlock,
} from '../types/newsletter'
import { defaultOptionalGenerationFields } from '../utils/newsletterTemplates'

type TemplateApiResponse = {
  id: string
  name: string
  description: string | null
  area: NewsletterTemplate['area']
  layout: TemplateLayoutBlock[] | null
  orientation: 'PORTRAIT' | 'LANDSCAPE'
  stateCode: string
  stateName: string
  createdAt: string
  requiredGenerationFields: TemplateGenerationField[]
  optionalGenerationFields: TemplateGenerationField[]
}

export async function listTemplates(): Promise<NewsletterTemplate[]> {
  const response = await axios.get<TemplateApiResponse[]>('/templates')

  return response.data.map((template) => ({
    ...template,
    requiredGenerationFields: template.requiredGenerationFields ?? [],
    optionalGenerationFields:
      template.optionalGenerationFields ?? defaultOptionalGenerationFields,
  }))
}

export async function getTemplateById(id: string): Promise<NewsletterTemplate> {
  const response = await axios.get<TemplateApiResponse>(`/templates/${id}`)

  return {
    ...response.data,
    requiredGenerationFields: response.data.requiredGenerationFields ?? [],
    optionalGenerationFields:
      response.data.optionalGenerationFields ?? defaultOptionalGenerationFields,
  }
}

export type TemplateAsset = {
  id?: string
  name: string
  url: string
  description?: string | null
  type: string
}

export async function getTemplateAssets(id: string): Promise<TemplateAsset[]> {
  const response = await axios.get<TemplateAsset[]>(`/templates/${id}/assets`)
  return response.data
}
