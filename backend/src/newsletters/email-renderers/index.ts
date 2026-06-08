import type { NewsletterBlockDto } from '../../blocks/newsletter-blocks';
import { renderHeaderEmail } from './headers/renderHeaderEmail';
import { renderBaseEmail } from './base/renderBaseEmail';
import { renderContentEmail } from './content/renderContentEmail';
import { renderMultimediaEmail } from './multimedia/renderMultimediaEmail';
import { renderIconEmail } from './icons/renderIconEmail';
import { renderSpecialEmail } from './special/renderSpecialEmail';

type RenderNewsletterEmailBlockOptions = {
  cidByAssetId: Map<string, string>;
  fallback: (
    block: NewsletterBlockDto,
    cidByAssetId: Map<string, string>,
  ) => string;
};

export function renderNewsletterEmailBlock(
  block: NewsletterBlockDto,
  options: RenderNewsletterEmailBlockOptions,
): string {
  switch (block.type) {
    case 'headerFull':
      return renderHeaderEmail(block, {
        logoPlacement: 'both',
        cidByAssetId: options.cidByAssetId,
      });

    case 'headerLeft':
      return renderHeaderEmail(block, {
        logoPlacement: 'left',
        cidByAssetId: options.cidByAssetId,
      });

    case 'headerRight':
      return renderHeaderEmail(block, {
        logoPlacement: 'right',
        cidByAssetId: options.cidByAssetId,
      });

    case 'ctaFull' :
    case 'ctaAlternative':
    case 'empty':
      return renderBaseEmail(block);

    case 'labelCenterBackgroundFull':
    case 'labelLeftBackgroundFull':
    case 'labelLeftBackgroundSmall':
    case 'labelTextLabelCenterFull':
    case 'textCenterBackgroundFull':
    case 'textDoubleCenterBackgroundFull':
    case 'textLabelCenterBackgroundFull':
    case 'textLeftBackgroundFull':
      return renderContentEmail(block, {
        cidByAssetId: options.cidByAssetId,
      });

    case 'imageBackgroundFull':
    case 'imageFull':
      return renderMultimediaEmail(block, {
        cidByAssetId: options.cidByAssetId,
      });
      
    case 'iconBoxBackgroundFull':
    case 'iconCenterBackgroundFull':
    case 'iconLeftBackgroundFull':
    case 'iconRightBackgroundFull':
      return renderIconEmail(block, {
        cidByAssetId: options.cidByAssetId,
      });

    case 'specialBoxBackgroundFull':
      return renderSpecialEmail(block, {
        cidByAssetId: options.cidByAssetId,
      });

    default:
      return options.fallback(block, options.cidByAssetId);
  }
}