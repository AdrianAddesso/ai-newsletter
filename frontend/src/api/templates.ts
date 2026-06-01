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
  state?: string
  stateCode?: string
  stateName: string
  createdAt: string
  requiredGenerationFields: TemplateGenerationField[]
  optionalGenerationFields: TemplateGenerationField[]
}

export async function listTemplates(): Promise<NewsletterTemplate[]> {
  const response = await axios.get<TemplateApiResponse[]>('/templates')

  return response.data.map((template) => {
    let parsedLayout = null;
    try {
      const rawLayout = typeof template.layout === 'string' ? JSON.parse(template.layout) : template.layout;
      if (Array.isArray(rawLayout)) {
        parsedLayout = rawLayout
          .map((item: any) => ({
            ...item,
            block_type:
              typeof item?.block_type === 'string' && item.block_type.trim().length > 0
                ? item.block_type
                : typeof item?.type === 'string' && item.type.trim().length > 0
                  ? item.type
                  : null,
          }))
          .filter(
            (item): item is TemplateLayoutBlock =>
              typeof item.block_type === 'string' && item.block_type.trim().length > 0,
          );
      } else {
        parsedLayout = rawLayout;
      }
    } catch (e) {
      console.error('Error parsing layout for template', template.id, e);
    }

    return {
      ...template,
      stateCode: template.stateCode ?? template.state ?? '',
      layout: parsedLayout,
      requiredGenerationFields: template.requiredGenerationFields ?? [],
      optionalGenerationFields:
        template.optionalGenerationFields ?? defaultOptionalGenerationFields,
    };
  })
}

export async function getTemplateById(id: string): Promise<NewsletterTemplate> {
  const response = await axios.get<TemplateApiResponse>(`/templates/${id}`)

  let parsedLayout = null;
  try {
    const rawLayout = typeof response.data.layout === 'string' ? JSON.parse(response.data.layout) : response.data.layout;
    if (Array.isArray(rawLayout)) {
      parsedLayout = rawLayout
        .map((item: any) => ({
          ...item,
          block_type:
            typeof item?.block_type === 'string' && item.block_type.trim().length > 0
              ? item.block_type
              : typeof item?.type === 'string' && item.type.trim().length > 0
                ? item.type
                : null,
        }))
        .filter(
          (item): item is TemplateLayoutBlock =>
            typeof item.block_type === 'string' && item.block_type.trim().length > 0,
        );
    } else {
      parsedLayout = rawLayout;
    }
  } catch (e) {
    console.error('Error parsing layout for template', id, e);
  }

  return {
    ...response.data,
    stateCode: response.data.stateCode ?? response.data.state ?? '',
    layout: parsedLayout,
    requiredGenerationFields: response.data.requiredGenerationFields ?? [],
    optionalGenerationFields:
      response.data.optionalGenerationFields ?? defaultOptionalGenerationFields,
  }
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
