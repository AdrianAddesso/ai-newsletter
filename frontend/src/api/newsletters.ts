import type {
  Newsletter,
  CreateNewsletterPayload,
  UpdateNewsletterPayload,
} from '../types/newsletter'

export type NewsletterStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'DISCARDED'

// Generar ID único (UUID v4)
export function generateNewsletterId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// MOCK LOCAL DB 
// Reemplazar por backend real cuando esté disponible

const STORAGE_KEY = 'newsletters_mock_db'

function normalizeNewsletter(newsletter: Newsletter): Newsletter {
  return {
    ...newsletter,
    assetSelection: newsletter.assetSelection ?? null,
  }
}

function getMockDb(): Record<string, Newsletter> {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    return {}
  }

  const parsed = JSON.parse(stored) as Record<string, Newsletter>

  return Object.fromEntries(
    Object.entries(parsed).map(([id, newsletter]) => [
      id,
      normalizeNewsletter(newsletter),
    ]),
  )
}

function saveMockDb(db: Record<string, Newsletter>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

export function seedNewsletterIfMissing(id: string, state: NewsletterStatus): void {
  const db = getMockDb()
  if (db[id]) return
  const now = new Date().toISOString()
  db[id] = {
    id,
    creatorUserId: '',
    state,
    templateId: '',
    brandKitId: null,
    blocks: [],
    comment: null,
    generationRequest: null,
    assetSelection: null,
    renderedHtml: null,
    createdAt: now,
    updatedAt: now,
  }
  saveMockDb(db)
}

export async function createNewsletter(
  payload: CreateNewsletterPayload,
): Promise<Newsletter> {

  await new Promise<void>((resolve) => window.setTimeout(resolve, 300))

  const now = new Date().toISOString()

  const newsletter: Newsletter = {
    id: generateNewsletterId(),
    creatorUserId: payload.creatorUserId ?? '',
    state: 'DRAFT',
    templateId: payload.templateId,
    brandKitId: payload.brandKitId,
    blocks: payload.blocks,
    comment: null,
    generationRequest: payload.generationRequest,
    assetSelection: payload.assetSelection,
    renderedHtml: null,
    createdAt: now,
    updatedAt: now,
  }

  const db = getMockDb()

  db[newsletter.id] = newsletter

  saveMockDb(db)

  return normalizeNewsletter(newsletter)
}

export async function getNewsletter(
  id: string,
): Promise<Newsletter> {

  await new Promise<void>((resolve) => window.setTimeout(resolve, 200))

  const db = getMockDb()

  const newsletter = db[id]

  if (!newsletter) {
    throw new Error(`Newsletter con ID ${id} no encontrado`)
  }

  return normalizeNewsletter(newsletter)
}

export async function updateNewsletter(
  id: string,
  payload: UpdateNewsletterPayload,
): Promise<Newsletter> {

  await new Promise<void>((resolve) => window.setTimeout(resolve, 300))

  const db = getMockDb()

  const newsletter = db[id]

  if (!newsletter) {
    throw new Error(`Newsletter con ID ${id} no encontrado`)
  }

  const updated: Newsletter = {
    ...newsletter,
    ...payload,
    updatedAt: new Date().toISOString(),
  }

  db[id] = updated

  saveMockDb(db)

  return normalizeNewsletter(updated)
}

export async function deleteNewsletter(
  id: string,
): Promise<void> {

  await new Promise<void>((resolve) => window.setTimeout(resolve, 200))

  const db = getMockDb()

  delete db[id]

  saveMockDb(db)
}

export async function getAllNewsletters(): Promise<Newsletter[]> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 200))
  return Object.values(getMockDb())
}

// ─────────────────────────────────────────────
// UPDATE STATUS
// ─────────────────────────────────────────────

export async function updateNewsletterStatus(
  newsletterId: string,
  state: NewsletterStatus,
  comment?: string | null,
): Promise<Newsletter> {

  await new Promise<void>((resolve) => window.setTimeout(resolve, 200))

  const db = getMockDb()

  const newsletter = db[newsletterId]

  const now = new Date().toISOString()

  if (!newsletter) {
    throw new Error(`Newsletter con ID ${newsletterId} no encontrado`)
  }

  const updated: Newsletter = {
    ...newsletter,
    state,
    comment: comment !== undefined ? comment : newsletter.comment,
    updatedAt: now,
  }

  db[newsletterId] = updated

  saveMockDb(db)

  return updated
}

//CONECTAR CON BACKEND REAL CUANDO ESTÉ DISPONIBLE / TENGO PROBLEMAS CON EL TOKEN PARA GENERAR EL NEWSLETTER
/*import axios from 'axios'

import type {
  Newsletter,
  CreateNewsletterPayload,
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

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

export async function createNewsletter(
  payload: CreateNewsletterPayload,
): Promise<Newsletter> {
  const response = await axios.post<Newsletter>(
    API_BASE,
    payload,
  )

  return response.data
}

// ─────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────

export async function getNewsletter(
  id: string,
): Promise<Newsletter> {
  const response = await axios.get<Newsletter>(
    `${API_BASE}/${id}`,
  )

  return response.data
}

// ─────────────────────────────────────────────
// GET ALL
// ─────────────────────────────────────────────

export async function getAllNewsletters(): Promise<Newsletter[]> {
  const response = await axios.get<Newsletter[]>(
    API_BASE,
  )

  return response.data
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

export async function updateNewsletter(
  id: string,
  payload: UpdateNewsletterPayload,
): Promise<Newsletter> {
  const response = await axios.patch<Newsletter>(
    `${API_BASE}/${id}`,
    payload,
  )

  return response.data
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

export async function deleteNewsletter(
  id: string,
): Promise<void> {
  await axios.delete(`${API_BASE}/${id}`)
}

// ─────────────────────────────────────────────
// UPDATE STATUS
// ─────────────────────────────────────────────

export async function updateNewsletterStatus(
  newsletterId: string,
  state: NewsletterStatus,
): Promise<Newsletter> {
  const response = await axios.post<Newsletter>(
    `${API_BASE}/${newsletterId}/status`,
    { state },
  )

  return response.data
}*/
