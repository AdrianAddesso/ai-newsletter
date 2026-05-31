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
  description?: string | null
  created_at: string
  updated_at: string
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
  description?: string | null
  type: Exclude<AssetType, 'BLOCK'>
}

export type UploadAssetRequest = {
  file: File
  type: Exclude<AssetType, 'BLOCK'>
  name: string
  description?: string | null
  brandKitId?: string
  signal?: AbortSignal
  onUploadProgress?: (progress: number) => void
}

export async function listAssets(
  type?: AssetType,
  brandKitId?: string,
): Promise<UploadAssetsResponse> {
  const response = await axios.get<UploadAssetsResponse>('/assets', {
    params:
      type || brandKitId
        ? {
            ...(type ? { type } : {}),
            ...(brandKitId ? { brandKitId } : {}),
          }
        : undefined,
  })

  return response.data
}

export async function uploadAsset({
  file,
  type,
  name,
  description,
  brandKitId,
  signal,
  onUploadProgress,
}: UploadAssetRequest): Promise<UploadedAsset> {
  const formData = new FormData()

  formData.append('files', file)
  formData.append('type', type)
  formData.append('name', name)
  if (description?.trim()) {
    formData.append('description', description.trim())
  }
  if (brandKitId) {
    formData.append('brandKitId', brandKitId)
  }

  const response = await axios.post<UploadAssetsResponse>(
    '/assets',
    formData,
    {
      signal,
      onUploadProgress: (event) => {
        if (!onUploadProgress || !event.total) return
        onUploadProgress(Math.round((event.loaded / event.total) * 100))
      },
    },
  )

  return response.data.assets[0]
}

export async function uploadAssets(
  files: File[],
  type: AssetType,
  brandKitId?: string,
): Promise<UploadAssetsResponse> {
  const formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file)
  })
  formData.append('type', type)
  if (brandKitId) {
    formData.append('brandKitId', brandKitId)
  }

  const response = await axios.post<UploadAssetsResponse>('/assets', formData)
  return response.data
}

export async function updateAsset(
  id: string,
  data: UpdateAssetRequest,
): Promise<UploadedAsset> {
  const response = await axios.patch<UploadedAsset>(`/assets/${id}`, data)
  return response.data
}

export async function deleteAsset(
  id: string,
  brandKitId?: string,
): Promise<void> {
  await axios.delete(`/assets/${id}`, {
    params: brandKitId ? { brandKitId } : undefined,
  })
}
