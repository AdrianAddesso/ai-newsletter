import { NewsletterBlockViewer } from '../viewer/NewsletterBlockViewer'

import type { NewsletterBlock, NewsletterFormat, } from '../../../types/newsletter'

type Props = {
  blocks: NewsletterBlock[]
  format?: NewsletterFormat
}

export function ApprovedNewsletterViewer({ blocks, format }: Props) {
  return (
    <NewsletterBlockViewer
      blocks={blocks}
      selectedBlockId=""
      onSelectBlock={() => {}}
      readOnly
      format={format}
    />
  )
}