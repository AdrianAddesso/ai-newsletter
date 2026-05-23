import axios from 'axios'

export type AssetType =
  | "IMAGE"
  | "ICON"
  | "LOGO"
  | "SHAPE"
  | "LOCKUP"
  | "KEYWORD"
  | "BLOCK"

export type UploadedAsset = {
  id: string
  name: string
  created_at: string
  url: string
  type: AssetType
  svgTemplate?: string | null
  maxChars?: number | null
  keywordText?: string | null
}

export type UploadAssetsResponse = {
  assets: UploadedAsset[]
}

export type UpdateAssetRequest = {
  name: string
  type: Exclude<AssetType, 'BLOCK'>
}

export async function listAssets(
  type?: AssetType,
): Promise<UploadAssetsResponse> {
  const response = await axios.get<UploadAssetsResponse>('/assets', {
    params: type ? { type } : undefined,
  })

  return response.data
}

export async function uploadAssets(
  files: File[],
  type: AssetType,
): Promise<UploadAssetsResponse> {
  const formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file)
  })
  formData.append('type', type)

  const response = await axios.post<UploadAssetsResponse>(
    '/assets',
    formData,
  )

  return response.data
}

export async function updateAsset(
  id: string,
  data: UpdateAssetRequest,
): Promise<UploadedAsset> {
  const response = await axios.patch<UploadedAsset>(`/assets/${id}`, data)
  return response.data
}

export async function deleteAsset(id: string): Promise<void> {
  await axios.delete(`/assets/${id}`)
}
