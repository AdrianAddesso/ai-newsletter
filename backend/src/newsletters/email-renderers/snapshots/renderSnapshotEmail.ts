import type { NewsletterBlockDto } from '../../../blocks/newsletter-blocks';
import { parseBlockValues } from '../../../blocks/newsletter-blocks';

type RenderSnapshotEmailOptions = {
  snapshotCidByBlockId: Map<string, string>;
};

export function renderSnapshotEmail(
  block: NewsletterBlockDto,
  options: RenderSnapshotEmailOptions,
): string | null {
  const snapshotCid = options.snapshotCidByBlockId.get(block.id);

  if (!snapshotCid) {
    return null;
  }

  const values = parseBlockValues(block.content);
  const href = values.href?.trim();

  return `
    <mj-column padding="0">
      <mj-image
        src="cid:${escapeHtml(snapshotCid)}"
        ${href ? `href="${escapeHtml(href)}"` : ''}
        padding="0"
        fluid-on-mobile="true"
      />
    </mj-column>
  `;
}

export function shouldRenderBlockAsSnapshot(block: NewsletterBlockDto): boolean {
  return !isBaseBlock(block.type);
}

function isBaseBlock(type: string): boolean {
  return type === 'ctaFull' || type === 'ctaAlternative' || type === 'empty';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}