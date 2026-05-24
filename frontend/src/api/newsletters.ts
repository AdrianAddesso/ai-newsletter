import axios from 'axios'
import type {
  CreateNewsletterPayload,
  Newsletter,
  NewsletterBlock,
  UpdateNewsletterPayload,
} from '../types/newsletter'

export type NewsletterStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'DISCARDED'

const API_BASE = '/newsletters'

function createBody(payload: CreateNewsletterPayload) {
  return {
    title: payload.title ?? 'Newsletter sin titulo',
    templateId: payload.templateId,
    brandKitId: payload.brandKitId,
    blocks: toPersistedBlocks(payload.blocks),
    generationContent: payload.generationContent,
  }
}

function updateBody(payload: UpdateNewsletterPayload) {
  const {
    title,
    templateId,
    brandKitId,
    blocks,
    state,
    generationContent,
  } = payload

  return {
    title,
    templateId,
    brandKitId,
    blocks: blocks ? toPersistedBlocks(blocks) : undefined,
    state,
    generationContent,
  }
}

function toPersistedBlocks(blocks: NewsletterBlock[]): NewsletterBlock[] {
  return blocks.map((block) => ({
    ...block,
    fields: block.fields.map((field) => {
      if (field.kind !== 'asset') {
        return field
      }

      return {
        id: field.id,
        kind: field.kind,
        label: field.label,
        assetId: field.assetId ?? null,
        assetName: field.assetName ?? null,
        keywordText: field.keywordText ?? null,
      }
    }),
  }))
}

export async function createNewsletter(
  payload: CreateNewsletterPayload,
): Promise<Newsletter> {
  const response = await axios.post<Newsletter>(API_BASE, createBody(payload))
  return response.data
}

export async function getNewsletter(id: string): Promise<Newsletter> {
  const response = await axios.get<Newsletter>(`${API_BASE}/${id}`)
  return response.data
}

export async function updateNewsletter(
  id: string,
  payload: UpdateNewsletterPayload,
): Promise<Newsletter> {
  const response = await axios.patch<Newsletter>(
    `${API_BASE}/${id}`,
    updateBody(payload),
  )
  return response.data
}

export async function deleteNewsletter(id: string): Promise<void> {
  await axios.delete(`${API_BASE}/${id}`)
}

export async function getAllNewsletters(): Promise<Newsletter[]> {
  const response = await axios.get<{ data: Newsletter[] }>(API_BASE)
  return response.data.data
}

export function seedNewsletterIfMissing(..._args: unknown[]): void {
  void _args
  return undefined
}

export async function updateNewsletterStatus(
  newsletterId: string,
  state: NewsletterStatus,
  comment?: string | null,
): Promise<Newsletter> {
  const response = await axios.post<Newsletter>(
    `${API_BASE}/${newsletterId}/status`,
    {
      state,
      allCommentaries: comment ?? undefined,
    },
  )

  return response.data
}
