import type { NewsletterBlockDto } from '../../../blocks/newsletter-blocks';
import { parseBlockValues } from '../../../blocks/newsletter-blocks';

type MultimediaEmailBlockType = 'imageBackgroundFull' | 'imageFull';

type RenderMultimediaEmailOptions = {
  cidByAssetId: Map<string, string>;
};

const defaultBackgroundColor = '#ffffff';

export function renderMultimediaEmail(
  block: NewsletterBlockDto,
  options: RenderMultimediaEmailOptions,
): string {
  if (!isMultimediaEmailBlock(block.type)) {
    return '';
  }

  if (block.type === 'imageFull') {
    return renderImageFullEmail(block, options);
  }

  return renderImageBackgroundFullEmail(block, options);
}

function isMultimediaEmailBlock(type: string): type is MultimediaEmailBlockType {
  return type === 'imageBackgroundFull' || type === 'imageFull';
}

function renderImageFullEmail(
  block: NewsletterBlockDto,
  options: RenderMultimediaEmailOptions,
): string {
  const values = parseBlockValues(block.content);
  const imageUrl = resolveAssetUrl(block, options.cidByAssetId, 'imageAsset');

  if (!imageUrl) {
    return renderEmptyImageFallback();
  }

  return `
    <mj-column padding="0" background-color="${defaultBackgroundColor}">
      <mj-image
        src="${escapeHtml(imageUrl)}"
        alt="${escapeHtml(values.altText ?? 'Full image')}"
        padding="0"
        width="960px"
        fluid-on-mobile="true"
      />
    </mj-column>
  `;
}

function renderImageBackgroundFullEmail(
  block: NewsletterBlockDto,
  options: RenderMultimediaEmailOptions,
): string {
  const values = parseBlockValues(block.content);
  const imageUrl = resolveAssetUrl(block, options.cidByAssetId, 'imageAsset');
  const backgroundImageUrl = resolveAssetUrl(
    block,
    options.cidByAssetId,
    'backgroundAsset',
  );

  const backgroundColor = values.overlayColor ?? defaultBackgroundColor;

  if (!imageUrl) {
    return renderEmptyImageFallback(backgroundColor);
  }

  return `
    <mj-column background-color="${escapeHtml(backgroundColor)}" padding="0">
      <mj-table padding="0">
        <tr>
          <td
            align="center"
            style="${buildBackgroundStyle(backgroundColor, backgroundImageUrl)};padding:32px 0;"
            ${backgroundImageUrl ? `background="${escapeHtml(backgroundImageUrl)}"` : ''}
          >
            <img
              src="${escapeHtml(imageUrl)}"
              alt="${escapeHtml(values.altText ?? 'Image')}"
              width="768"
              style="display:block;width:80%;max-width:768px;height:auto;border:0;border-radius:8px;"
            />
          </td>
        </tr>
      </mj-table>
    </mj-column>
  `;
}

function renderEmptyImageFallback(backgroundColor = defaultBackgroundColor): string {
  return `
    <mj-column background-color="${escapeHtml(backgroundColor)}" padding="0">
      <mj-spacer height="160px" />
    </mj-column>
  `;
}

function resolveAssetUrl(
  block: NewsletterBlockDto,
  cidByAssetId: Map<string, string>,
  fieldKey: string,
): string | null {
  const binding = block.assetBindings.find(
    (assetBinding) => assetBinding.fieldKey === fieldKey,
  );

  if (!binding) {
    return null;
  }

  const cid = cidByAssetId.get(binding.assetId);

  if (cid) {
    return `cid:${cid}`;
  }

  return binding.assetUrl ?? null;
}

function buildBackgroundStyle(
  backgroundColor: string,
  backgroundImage: string | null,
): string {
  return [
    `background-color:${escapeCssValue(backgroundColor)}`,
    backgroundImage
      ? `background-image:url('${escapeCssValue(backgroundImage)}')`
      : '',
    backgroundImage ? 'background-size:cover' : '',
    backgroundImage ? 'background-position:center center' : '',
    backgroundImage ? 'background-repeat:no-repeat' : '',
  ]
    .filter(Boolean)
    .join(';');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeCssValue(value: string): string {
  return value.replace(/[;"<>]/g, '');
}