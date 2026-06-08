import type { NewsletterBlockDto } from '../../../blocks/newsletter-blocks';
import { parseBlockValues } from '../../../blocks/newsletter-blocks';

type RenderSpecialEmailOptions = {
  cidByAssetId: Map<string, string>;
};

const defaultBackgroundColor = '#ffffff';
const defaultTextColor = '#30261D';
const labelBackgroundColor = '#FFC800';
const labelTextColor = '#30261D';

export function renderSpecialEmail(
  block: NewsletterBlockDto,
  options: RenderSpecialEmailOptions,
): string {
  if (block.type !== 'specialBoxBackgroundFull') {
    return '';
  }

  const values = parseBlockValues(block.content);
  const backgroundColor = values.bgColor ?? defaultBackgroundColor;
  const backgroundImage = resolveAssetUrl(block, options.cidByAssetId, 'backgroundAsset');
  const imageUrl = resolveAssetUrl(block, options.cidByAssetId, 'imageAsset');

  return `
    <mj-column background-color="${escapeHtml(backgroundColor)}" padding="0">
      <mj-table padding="0">
        <tr>
          <td
            style="${buildBackgroundStyle(backgroundColor, backgroundImage)}"
            ${backgroundImage ? `background="${escapeHtml(backgroundImage)}"` : ''}
          >
            ${renderSpecialBody(values, imageUrl)}
          </td>
        </tr>
      </mj-table>
    </mj-column>
  `;
}

function renderSpecialBody(
  values: Partial<Record<string, string>>,
  imageUrl: string | null,
): string {
  const title = values.title ?? 'Lorem ipsum sit';
  const introText =
    values.introText ??
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
  const bodyText =
    values.bodyText ??
    'Provident blanditiis omnis natus ratione necessitatibus.';
  const closingText =
    values.closingText ??
    'Consequuntur eum voluptas iure repellat voluptate nisi.';

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td width="66%" valign="middle" style="padding:32px 16px 32px 48px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="left" style="padding-bottom:14px;">
                ${renderLabel(title, values, 'title')}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:6px 0;">
                ${renderText(introText, values, 'introText')}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:6px 0;">
                ${renderText(bodyText, values, 'bodyText')}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:6px 0;">
                ${renderText(closingText, values, 'closingText')}
              </td>
            </tr>
          </table>
        </td>
        <td width="34%" valign="middle" align="center" style="padding:32px 48px 32px 16px;">
          ${renderImage(imageUrl)}
        </td>
      </tr>
    </table>
  `;
}

function renderLabel(
  label: string,
  values: Partial<Record<string, string>>,
  fieldKey: string,
): string {
  const textStyle = resolveTextStyle(values, fieldKey, {
    fallbackFontSize: '14px',
    defaultBold: true,
    color: labelTextColor,
  });

  return `
    <table
      role="presentation"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="display:inline-table;border-collapse:separate;"
    >
      <tr>
        <td
          bgcolor="${labelBackgroundColor}"
          style="${textStyle};background-color:${labelBackgroundColor};border-radius:8px;padding:8px 14px;border-right:4px solid #E6B300;border-bottom:4px solid #E6B300;box-shadow:4px 4px 0 #E6B300;"
        >
          ${escapeHtml(label)}
        </td>
      </tr>
    </table>
  `;
}

function renderText(
  text: string,
  values: Partial<Record<string, string>>,
  fieldKey: string,
): string {
  return `
    <div style="${resolveTextStyle(values, fieldKey, {
      fallbackFontSize: '16px',
      defaultBold: false,
      color: defaultTextColor,
    })};text-align:center;">
      ${escapeHtml(text)}
    </div>
  `;
}

function renderImage(imageUrl: string | null): string {
  if (!imageUrl) {
    return `
      <table role="presentation" width="180" height="120" cellspacing="0" cellpadding="0" border="0" style="background-color:#A8A59D;border-radius:8px;">
        <tr>
          <td align="center" valign="middle" style="font-family:Arial,sans-serif;color:#706D66;font-size:14px;">
            Imagen
          </td>
        </tr>
      </table>
    `;
  }

  return `
    <img
      src="${escapeHtml(imageUrl)}"
      alt=""
      width="220"
      border="0"
      style="display:block;width:80%;max-width:220px;height:auto;border:0;border-radius:8px;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;"
    />
  `;
}

function resolveTextStyle(
  values: Partial<Record<string, string>>,
  fieldKey: string,
  options: {
    fallbackFontSize: string;
    defaultBold: boolean;
    color: string;
  },
): string {
  const fontSize =
    values[`${fieldKey}FontSize`] ??
    values.fontSize ??
    options.fallbackFontSize;

  const fontFamily =
    values[`${fieldKey}FontFamily`] ??
    values.fontFamily ??
    'Arial';

  const typographyStyle = values.typographyStyle ?? '';
  const normalizedFontFamily = fontFamily.toLowerCase();

  const isBold =
    options.defaultBold ||
    typographyStyle.includes('bold') ||
    normalizedFontFamily.includes('bold');

  const isItalic =
    typographyStyle.includes('italic') ||
    normalizedFontFamily.includes('italic');

  const fallbackFontFamily =
    normalizedFontFamily.includes('cnd') || normalizedFontFamily.includes('condensed')
      ? 'Arial Narrow, Arial, sans-serif'
      : 'Arial, sans-serif';

  return [
    `font-family:${escapeCssValue(fontFamily)}, ${fallbackFontFamily}`,
    `font-size:${escapeCssValue(fontSize)}`,
    `font-weight:${isBold ? '700' : '400'}`,
    `font-style:${isItalic ? 'italic' : 'normal'}`,
    'line-height:1.45',
    'mso-line-height-rule:exactly',
    `color:${options.color}`,
  ].join(';');
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
    backgroundImage ? `background-image:url('${escapeCssValue(backgroundImage)}')` : '',
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