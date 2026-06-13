import type { NewsletterBlockDto } from '../../../blocks/newsletter-blocks';
import { parseBlockValues } from '../../../blocks/newsletter-blocks';

type RenderSnapshotEmailOptions = {
  emailWidth: number;
  snapshotByBlockId: Map<
    string,
    {
      cid: string;
      width: number;
      height: number;
    }
  >;
};

export function renderSnapshotEmail(
  block: NewsletterBlockDto,
  options: RenderSnapshotEmailOptions,
): string | null {
  const snapshot = options.snapshotByBlockId.get(block.id);

  if (!snapshot) {
    return null;
  }

  const values = parseBlockValues(block.content);
  const href = (values.href ?? values.url ?? values.link ?? '').trim();
  const columnWidth = Math.min(snapshot.width, options.emailWidth);

  return `
    <mj-column width="${Math.round(columnWidth)}px" padding="0">
      <mj-image
        src="cid:${escapeHtml(snapshot.cid)}"
        ${href ? `href="${escapeHtml(href)}"` : ''}
        width="${Math.round(snapshot.width)}px"
        padding="0"
      />
    </mj-column>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
