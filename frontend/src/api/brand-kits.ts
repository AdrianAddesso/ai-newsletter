import axios from 'axios'
import type { AssetType } from './assets'

export type BrandKit = {
  id: string
  name: string
}

export type BrandKitResourceAsset = {
  id: string
  name: string
  type: AssetType
  url: string
}

export type BrandKitResourceColor = {
  id: string
  name: string
  hex: string
}

export type BrandKitResourceFont = {
  id: string
  name: string
  style: string
  groupName: string
  url: string
}

export type BrandKitResources = {
  brandKit: BrandKit
  assets: BrandKitResourceAsset[]
  colors: BrandKitResourceColor[]
  fonts: BrandKitResourceFont[]
}

export async function listBrandKits(): Promise<BrandKit[]> {
  const response = await axios.get<BrandKit[]>('/brand-kit')
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
