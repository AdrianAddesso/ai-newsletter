import { BlockList } from '../components/BlockList'

import type {
  NewsletterBlock,
} from '../../../types/newsletter'

type Props = {
  blocks: NewsletterBlock[]
  selectedBlockId: string
  onSelectBlock: (id: string) => void
  readOnly?: boolean
}

export function NewsletterBlockViewer({
  blocks,
  selectedBlockId,
  onSelectBlock,
  readOnly = false,
}: Props) {
  return (
    <BlockList
      blocks={blocks}
      selectedBlockId={selectedBlockId}
      onSelectBlock={onSelectBlock}
      readOnly={readOnly}
    />
  )
}