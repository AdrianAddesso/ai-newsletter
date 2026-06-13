import type { NewsletterBlockDto } from '../../blocks/newsletter-blocks';
import { renderSnapshotEmail } from './snapshots/renderSnapshotEmail';

type RenderNewsletterEmailBlockOptions = {
  cidByAssetId: Map<string, string>;
  emailWidth: number;
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
  const snapshotEmail = renderSnapshotEmail(block, {
    emailWidth: options.emailWidth,
    snapshotByBlockId: options.snapshotByBlockId ?? new Map(),
  });

  if (snapshotEmail) {
    return snapshotEmail;
  }

  return options.fallback(block, options.cidByAssetId);
}
