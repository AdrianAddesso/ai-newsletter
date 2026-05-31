import axios from 'axios'
import type {
  BlockReviewComment,
  CreateNewsletterPayload,
  Newsletter,
  NewsletterBlock,
  NewsletterListItem,
  ReviewInboxItem,
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
    createdByUserId: payload.creatorUserId,
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

function toPersistedBlocks(blocks: NewsletterBlock[]) {
  return blocks.map((block) => ({
    id: block.id,
    type: block.type,
    category: block.category,
    name: block.name,
    content: block.content,
    row: block.row,
    gridColumn: block.gridColumn,
    displayOrder: block.displayOrder,
    mustFill: block.mustFill,
    comment: block.comment,
    assetBindings: block.assetBindings.map((binding) => ({
      fieldKey: binding.fieldKey,
      assetId: binding.assetId,
      keywordText: binding.keywordText ?? null,
    })),
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

export async function getAllNewsletters(): Promise<NewsletterListItem[]> {
  const response = await axios.get<{ data: NewsletterListItem[] }>(API_BASE)
  return Array.isArray(response.data?.data) ? response.data.data : []
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

export async function getReviewInbox(): Promise<ReviewInboxItem[]> {
  const response = await axios.get<ReviewInboxItem[]>(`${API_BASE}/reviews`)
  return response.data
}

export async function requestNewsletterChanges(
  newsletterId: string,
  blockComments: Array<Pick<BlockReviewComment, 'blockId' | 'content'>>,
): Promise<Newsletter> {
  const response = await axios.post<Newsletter>(
    `${API_BASE}/${newsletterId}/review/request-changes`,
    {
      blockComments,
    },
  )

  return response.data
}

export async function approveNewsletterReview(
  newsletterId: string,
): Promise<Newsletter> {
  const response = await axios.post<Newsletter>(
    `${API_BASE}/${newsletterId}/review/approve`,
    {},
  )

  return response.data
}
