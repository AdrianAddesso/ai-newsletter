import type { Newsletter } from '../../../types/newsletter'

import { NewsletterBlockViewer } from './NewsletterBlockViewer'

import { NewsletterHtmlViewer } from './NewsletterHtmlViewer'

type Props = {
  newsletter: Newsletter
  selectedBlockId?: string
  onSelectBlock?: (id: string) => void
  readOnly?: boolean
}

export function NewsletterViewer({
  newsletter,
  selectedBlockId,
  onSelectBlock,
  readOnly = false,
}: Props) {
  if (newsletter.renderedHtml) {
    return (
      <NewsletterHtmlViewer
        html={newsletter.renderedHtml}
      />
    )
  }

  return (
    <NewsletterBlockViewer
      blocks={newsletter.blocks}
      selectedBlockId={selectedBlockId ?? ''}
      onSelectBlock={onSelectBlock ?? (() => {})}
      readOnly={readOnly}
    />
  )
}