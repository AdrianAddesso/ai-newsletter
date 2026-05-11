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

function getMockDb(): Record<string, Newsletter> {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : {}
}

function saveMockDb(db: Record<string, Newsletter>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

export async function createNewsletter(
  payload: CreateNewsletterPayload,
): Promise<Newsletter> {

  await new Promise<void>((resolve) => window.setTimeout(resolve, 300))

  const now = new Date().toISOString()

  const newsletter: Newsletter = {
    id: generateNewsletterId(),
    creatorUserId: payload.creatorUserId,
    state: 'DRAFT',
    templateId: payload.templateId,
    blocks: payload.blocks,
    comment: null,
    generationRequest: payload.generationRequest,
    renderedHtml: null,
    createdAt: now,
    updatedAt: now,
  }

  const db = getMockDb()

  db[newsletter.id] = newsletter

  saveMockDb(db)

  return newsletter
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

  return newsletter
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

  return updated
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
  const db = getMockDb()
  return Object.values(db).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

// ─────────────────────────────────────────────
// UPDATE STATUS
// ─────────────────────────────────────────────

export async function updateNewsletterStatus(
  newsletterId: string,
  state: NewsletterStatus,
): Promise<Newsletter> {

  await new Promise<void>((resolve) => window.setTimeout(resolve, 200))

  const db = getMockDb()

  const newsletter = db[newsletterId]

  if (!newsletter) {
    throw new Error(
      `Newsletter con ID ${newsletterId} no encontrado`,
    )
  }

  const updated: Newsletter = {
    ...newsletter,
    state,
    updatedAt: new Date().toISOString(),
  }

  db[newsletterId] = updated

  saveMockDb(db)

  return updated
}

// Puebla el mock DB con datos de prueba si está vacío
export function seedMockNewslettersIfEmpty(): void {
  const db = getMockDb()
  if (Object.keys(db).length > 0) return

  const baseBlocks = [
    { id: 'header', name: 'Encabezado', text: 'Nestlé Comunica', backgroundColor: '#FFFFFF', comment: null },
    { id: 'headline', name: 'Título principal', text: 'Actualizaciones del equipo', backgroundColor: '#97CAEB', comment: null },
    { id: 'body', name: 'Cuerpo', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', backgroundColor: '#FFFFFF', comment: null },
    { id: 'cta', name: 'Llamado a la acción', text: 'Conocé más en el portal interno.', backgroundColor: '#FFC600', comment: null },
  ]

  const seed: Newsletter[] = [
    {
      id: 'seed-draft-user',
      creatorUserId: '3',
      state: 'DRAFT',
      templateId: 'corporate-update',
      blocks: baseBlocks.map(b => ({ ...b })),
      comment: null,
      generationRequest: null,
      renderedHtml: null,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'seed-in-review-user',
      creatorUserId: '3',
      state: 'IN_REVIEW',
      templateId: 'weekly-brief',
      blocks: baseBlocks.map(b => ({ ...b, text: b.text + ' (en revisión)' })),
      comment: null,
      generationRequest: null,
      renderedHtml: null,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'seed-changes-admin',
      creatorUserId: '1',
      state: 'CHANGES_REQUESTED',
      templateId: 'people-story',
      blocks: baseBlocks.map(b => ({ ...b, text: b.text + ' (cambios pedidos)', comment: 'Revisar el tono del titular.' })),
      comment: 'Revisar el tono del titular.',
      generationRequest: null,
      renderedHtml: null,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]

  const newDb: Record<string, Newsletter> = {}
  for (const n of seed) newDb[n.id] = n
  saveMockDb(newDb)
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