import { useEffect, useState } from 'react'
import type { AssetType } from '../api/assets'
import { getBlockPreviewUrl } from '../utils/block.utils'

type BlockPreviewUrlState = Record<string, string>

export function useBlockPreviewUrls(
  previewKeys: string[],
  type: AssetType = 'IMAGE',
): BlockPreviewUrlState {
  const [previewUrls, setPreviewUrls] = useState<BlockPreviewUrlState>({})
  const previewKeySignature = [...new Set(previewKeys.filter(Boolean))]
    .sort()
    .join('\n')

  useEffect(() => {
    const uniquePreviewKeys = previewKeySignature
      ? previewKeySignature.split('\n')
      : []

    if (!uniquePreviewKeys.length) {
      return
    }

    let isMounted = true

    Promise.all(
      uniquePreviewKeys.map(async (previewKey) => {
        const url = await getBlockPreviewUrl(previewKey, type)

        return [previewKey, url] as const
      }),
    )
      .then((entries) => {
        if (!isMounted) {
          return
        }

        setPreviewUrls(Object.fromEntries(entries))
      })
      .catch(() => {
        if (isMounted) {
          setPreviewUrls({})
        }
      })

    return () => {
      isMounted = false
    }
  }, [previewKeySignature, type])

  return previewKeySignature ? previewUrls : {}
}
