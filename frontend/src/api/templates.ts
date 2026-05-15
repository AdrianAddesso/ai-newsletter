import axios from 'axios'
import type { NewsletterTemplate, TemplateGenerationField } from '../types/newsletter'
import { defaultOptionalGenerationFields } from '../utils/newsletterTemplates'

type TemplateApiResponse = {
  id: string
  name: string
  description: string | null
  area: NewsletterTemplate['area']
  layout: string | null
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
