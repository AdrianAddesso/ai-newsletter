import axios from 'axios'

export type AssetType =
  | 'IMAGE'
  | 'ICON'
  | 'LOGO'
  | 'SHAPE'
  | 'LOCKUP'
  | 'KEYWORD'

export type UploadedAsset = {
  id: string
  name: string
  url: string
  type: AssetType
}

export type UploadAssetsResponse = {
  assets: UploadedAsset[]
}

export async function listAssets(
  type?: AssetType,
): Promise<UploadAssetsResponse> {
  const response = await axios.get<UploadAssetsResponse>('/assets', {
    params: type ? { type } : undefined,
    headers: {
      'Content-Type': 'multipart/form-data',
    }
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
