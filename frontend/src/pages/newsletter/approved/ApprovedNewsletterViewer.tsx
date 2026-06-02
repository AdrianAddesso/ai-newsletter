import { PreviewCanvas } from '../../../components/canvas/PreviewCanvas'
import type { NewsletterBlock, TemplateLayoutItem } from '../../../types/newsletter'

type Props = {
  blocks: NewsletterBlock[]
}

export function ApprovedNewsletterViewer({ blocks }: Props) {
  const layoutItems: TemplateLayoutItem[] = blocks.map(block => ({
    block_type: block.type,
    content: block.content,
    row: block.row,
    grid_column: block.gridColumn,
    display_order: block.displayOrder,
  }))

  return <PreviewCanvas layout={layoutItems} />
}