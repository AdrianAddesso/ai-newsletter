import type { NewsletterBlockDto } from '../../blocks/newsletter-blocks';
import { renderBaseEmail } from './base/renderBaseEmail';
import {
  renderSnapshotEmail,
  shouldRenderBlockAsSnapshot,
} from './snapshots/renderSnapshotEmail';

type RenderNewsletterEmailBlockOptions = {
  cidByAssetId: Map<string, string>;
  snapshotByBlockId?: Map<
    string,
    {
      cid: string;
      width: number;
      height: number;
    }
  >;
  fallback: (
    block: NewsletterBlockDto,
    cidByAssetId: Map<string, string>,
  ) => string;
};

export function renderNewsletterEmailBlock(
  block: NewsletterBlockDto,
  options: RenderNewsletterEmailBlockOptions,
): string {
  if (block.type === 'ctaFull' || block.type === 'ctaAlternative' || block.type === 'empty') {
    return renderBaseEmail(block);
  }

  if (shouldRenderBlockAsSnapshot(block)) {
    const snapshotEmail = renderSnapshotEmail(block, {
      snapshotByBlockId: options.snapshotByBlockId ?? new Map(),
    });

    if (snapshotEmail) {
      return snapshotEmail;
    }
  }

  return options.fallback(block, options.cidByAssetId);
}
