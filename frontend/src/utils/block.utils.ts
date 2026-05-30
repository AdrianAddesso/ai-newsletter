import axios from 'axios'
import type { AssetType, UploadedAsset } from '../api/assets'

const blockPreviewUrlCache = new Map<string, string>()

export async function getBlockPreviewUrl(
  previewKey: string,
  type: AssetType = 'BLOCK',
): Promise<string> {
  const cacheKey = `${type}:${previewKey}`
  const cachedUrl = blockPreviewUrlCache.get(cacheKey)

  if (cachedUrl) {
    return cachedUrl
  }

  const response = await axios.get<UploadedAsset>(
    '/assets/seeded',
    {
      params: {
        storageKey: previewKey.includes('/') ? previewKey : `assets/blocks/${previewKey}`,
        type,
      },
    },
  )

  blockPreviewUrlCache.set(cacheKey, response.data.url)

  return response.data.url
}
