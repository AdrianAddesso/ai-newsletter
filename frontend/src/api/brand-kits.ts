import axios from 'axios'
import type { AssetType } from './assets'

export type BrandKit = {
  id: string
  name: string
  active: boolean
  created_at: string
  updated_at: string
  font_group_id: string | null
}

export type BrandKitResourceAsset = {
  id: string
  name: string
  type: AssetType
  url: string
  svgTemplate?: string | null
  maxChars?: number | null
  keywordText?: string | null
}

export type BrandKitResourceColor = {
  id: string
  name: string
  hex: string
}

export type BrandKitFont = {
  id: string
  name: string
  style: string
  groupName: string
  url: string
  file_name: string
  extension: string | null
  size_bytes: number | null
  created_at: string
}

export type BrandKitResources = {
  brandKit: BrandKit
  assets: BrandKitResourceAsset[]
  colors: BrandKitResourceColor[]
  fonts: BrandKitFont[]
}

export type CreateBrandKitRequest = {
  name: string
  active: boolean
}

export type UpdateBrandKitRequest = Partial<CreateBrandKitRequest>

export type UpsertBrandKitColorRequest = {
  name: string
  hex: string
}

export type UpdateBrandKitFontRequest = {
  name: string
  style: string
}

export type UploadBrandKitFontsResponse = {
  fonts: BrandKitFont[]
}

export async function listBrandKits(options?: {
  includeInactive?: boolean
}): Promise<BrandKit[]> {
  const response = await axios.get<BrandKit[]>('/brand-kit', {
    params: options?.includeInactive ? { includeInactive: 'true' } : undefined,
  })
  return response.data
}

export async function getBrandKit(brandKitId: string): Promise<BrandKit> {
  const response = await axios.get<BrandKit>(`/brand-kit/${brandKitId}`)
  return response.data
}

export async function getBrandKitResources(
  brandKitId: string,
): Promise<BrandKitResources> {
  const response = await axios.get<BrandKitResources>(
    `/brand-kit/${brandKitId}/resources`,
  )
  return response.data
}

export async function createBrandKit(
  request: CreateBrandKitRequest,
): Promise<BrandKit> {
  const response = await axios.post<BrandKit>('/brand-kit', request)
  return response.data
}

export async function updateBrandKit(
  brandKitId: string,
  request: UpdateBrandKitRequest,
): Promise<BrandKit> {
  const response = await axios.patch<BrandKit>(
    `/brand-kit/${brandKitId}`,
    request,
  )
  return response.data
}

export async function deleteBrandKit(brandKitId: string): Promise<void> {
  await axios.delete(`/brand-kit/${brandKitId}`)
}

export async function createBrandKitColor(
  brandKitId: string,
  request: UpsertBrandKitColorRequest,
): Promise<BrandKitResourceColor> {
  const response = await axios.post<BrandKitResourceColor>(
    `/brand-kit/${brandKitId}/colors`,
    request,
  )
  return response.data
}

export async function updateBrandKitColor(
  brandKitId: string,
  colorId: string,
  request: UpsertBrandKitColorRequest,
): Promise<BrandKitResourceColor> {
  const response = await axios.patch<BrandKitResourceColor>(
    `/brand-kit/${brandKitId}/colors/${colorId}`,
    request,
  )
  return response.data
}

export async function deleteBrandKitColor(
  brandKitId: string,
  colorId: string,
): Promise<void> {
  await axios.delete(`/brand-kit/${brandKitId}/colors/${colorId}`)
}

export async function listBrandKitFonts(
  brandKitId: string,
): Promise<UploadBrandKitFontsResponse> {
  const response = await axios.get<UploadBrandKitFontsResponse>(
    `/brand-kit/${brandKitId}/fonts`,
  )
  return response.data
}

export async function uploadBrandKitFonts(
  brandKitId: string,
  files: File[],
): Promise<UploadBrandKitFontsResponse> {
  const formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file)
  })

  const response = await axios.post<UploadBrandKitFontsResponse>(
    `/brand-kit/${brandKitId}/fonts`,
    formData,
  )
  return response.data
}

export async function updateBrandKitFont(
  brandKitId: string,
  fontId: string,
  request: UpdateBrandKitFontRequest,
): Promise<BrandKitFont> {
  const response = await axios.patch<BrandKitFont>(
    `/brand-kit/${brandKitId}/fonts/${fontId}`,
    request,
  )
  return response.data
}

export async function deleteBrandKitFont(
  brandKitId: string,
  fontId: string,
): Promise<void> {
  await axios.delete(`/brand-kit/${brandKitId}/fonts/${fontId}`)
}
