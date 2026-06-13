import axios from 'axios'
import type { TemplateMutationResponse } from '@shared/types/template.types'
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
  layout: TemplateLayoutBlock[] | string | null
  orientation: 'PORTRAIT' | 'LANDSCAPE'
  state?: string
  stateCode?: string
  stateName: string
  createdAt: string
  promptBase?: string | null
  prompt_base?: string | null
  requiredGenerationFields: TemplateGenerationField[]
  optionalGenerationFields: TemplateGenerationField[]
}

export type TemplateDetail = NewsletterTemplate & {
  promptBase: string
}

export type TemplateMutationPayload = {
  name: string
  description: string
  promptBase: string
  state: string
  orientation: 'PORTRAIT' | 'LANDSCAPE'
  area: NewsletterTemplate['area']
  layout: Array<{
    block_type: string | null
    content: string | null
    row: number
    grid_column: number
    display_order: number
  }>
}

const parseTemplateLayout = (
  templateId: string,
  rawLayout: TemplateApiResponse['layout'],
): TemplateLayoutBlock[] | null => {
  try {
    const parsedLayout =
      typeof rawLayout === 'string' ? JSON.parse(rawLayout) : rawLayout

    if (!Array.isArray(parsedLayout)) {
      return parsedLayout
    }

    return parsedLayout
      .map((item: unknown) => {
        const block = item as Partial<TemplateLayoutBlock>

        return {
          ...block,
          block_type:
            typeof block?.block_type === 'string' && block.block_type.trim().length > 0
              ? block.block_type
              : typeof block?.type === 'string' && block.type.trim().length > 0
                ? block.type
                : null,
        }
      })
      .filter(
        (item): item is TemplateLayoutBlock =>
          typeof item.block_type === 'string' && item.block_type.trim().length > 0,
      )
  } catch (error) {
    console.error('Error parsing layout for template', templateId, error)
    return null
}
}

const normalizeTemplate = (template: TemplateApiResponse): TemplateDetail => ({
  ...template,
  stateCode: template.stateCode ?? template.state ?? '',
  layout: parseTemplateLayout(template.id, template.layout),
  promptBase: template.promptBase ?? template.prompt_base ?? '',
  requiredGenerationFields: template.requiredGenerationFields ?? [],
  optionalGenerationFields:
    template.optionalGenerationFields ?? defaultOptionalGenerationFields,
})

export async function listTemplates(): Promise<NewsletterTemplate[]> {
  const response = await axios.get<TemplateApiResponse[]>('/templates')
  return response.data.map(normalizeTemplate)
}

export async function getTemplateById(id: string): Promise<TemplateDetail> {
  const response = await axios.get<TemplateApiResponse>(`/templates/${id}`)
  return normalizeTemplate(response.data)
}

export async function updateTemplate(
  id: string,
  payload: TemplateMutationPayload,
): Promise<TemplateMutationResponse> {
  const response = await axios.patch<TemplateMutationResponse>(
    `/templates/${id}`,
    payload,
  )

  return response.data
}

export async function deleteTemplate(id: string): Promise<void> {
  await axios.delete(`/templates/${id}`)
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
