import { BlockList } from '../components/BlockList'

import type {
  NewsletterBlock,
  NewsletterFormat,
} from '../../../types/newsletter'

type Props = {
  blocks: NewsletterBlock[]
  selectedBlockId: string
  onSelectBlock: (id: string) => void
  readOnly?: boolean
  format?: NewsletterFormat
}

export function NewsletterBlockViewer({
  blocks,
  selectedBlockId,
  onSelectBlock,
  readOnly = false,
  format,
}: Props) {
  return (
    <BlockList
      blocks={blocks}
      selectedBlockId={selectedBlockId}
      onSelectBlock={onSelectBlock}
      readOnly={readOnly}
      format={format}
    />
  )
}