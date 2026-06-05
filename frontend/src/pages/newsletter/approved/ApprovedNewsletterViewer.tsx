import { NewsletterBlockViewer } from '../viewer/NewsletterBlockViewer'

import type { NewsletterBlock } from '../../../types/newsletter'

type Props = {
  blocks: NewsletterBlock[]
}

export function ApprovedNewsletterViewer({ blocks }: Props) {
  return (
    <NewsletterBlockViewer
      blocks={blocks}
      selectedBlockId=""
      onSelectBlock={() => {}}
      readOnly
    />
  )
}