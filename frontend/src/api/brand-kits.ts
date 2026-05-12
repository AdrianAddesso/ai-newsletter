import axios from 'axios'

export type BrandKit = {
  id: string
  name: string
}

export async function listBrandKits(): Promise<BrandKit[]> {
  const response = await axios.get<BrandKit[]>('/brand-kit')
  return response.data
}
