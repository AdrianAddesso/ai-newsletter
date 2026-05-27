import type {
  NewsletterBlock,
  NewsletterBlockAssetBinding,
} from '../types/newsletter'
import { parseContent, serializeContent } from './blockContent'

export function updateBlockValue(
  block: NewsletterBlock,
  key: string,
  value: string,
): NewsletterBlock {
  return updateBlockValues(block, {
    ...parseContent<Record<string, string>>(block.content),
    [key]: value,
  })
}

export function updateBlockValues(
  block: NewsletterBlock,
  values: Record<string, string | null | undefined>,
): NewsletterBlock {
  return {
    ...block,
    content: serializeContent(
      Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, value ?? '']),
      ),
    ),
  }
}

export function setBlockAssetBinding(
  block: NewsletterBlock,
  binding: NewsletterBlockAssetBinding,
): NewsletterBlock {
  const assetBindings = [
    ...block.assetBindings.filter(
      (currentBinding) => currentBinding.fieldKey !== binding.fieldKey,
    ),
    binding,
  ]

  return {
    ...block,
    assetBindings,
  }
}

export function removeBlockAssetBinding(
  block: NewsletterBlock,
  fieldKey: string,
): NewsletterBlock {
  return {
    ...block,
    assetBindings: block.assetBindings.filter(
      (binding) => binding.fieldKey !== fieldKey,
    ),
  }
}

export function getBlockAssetBinding(
  block: NewsletterBlock,
  fieldKey: string,
): NewsletterBlockAssetBinding | undefined {
  return block.assetBindings.find((binding) => binding.fieldKey === fieldKey)
}
