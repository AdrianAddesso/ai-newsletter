import type { NewsletterBlockDto } from '../../../blocks/newsletter-blocks';
import { parseBlockValues } from '../../../blocks/newsletter-blocks';

type IconEmailBlockType =
  | 'iconBoxBackgroundFull'
  | 'iconCenterBackgroundFull'
  | 'iconLeftBackgroundFull'
  | 'iconRightBackgroundFull';

type RenderIconEmailOptions = {
  cidByAssetId: Map<string, string>;
};

const defaultBackgroundColor = '#ffffff';
const defaultTextColor = '#30261D';

const defaultIconItems = [
  'Lorem ipsum dolor sit amet consectetur.',
  'Adipiscing elit provident blanditiis.',
  'Natus ratione necessitatibus consequuntur.',
  'Eum voluptas iure repellat voluptate.',
];

export function renderIconEmail(
  block: NewsletterBlockDto,
  options: RenderIconEmailOptions,
): string {
  if (!isIconEmailBlock(block.type)) {
    return '';
  }

  const values = parseBlockValues(block.content);
  const backgroundColor = values.bgColor ?? defaultBackgroundColor;
  const backgroundImage = resolveAssetUrl(block, options.cidByAssetId, 'backgroundAsset');
  const iconUrl = resolveAssetUrl(block, options.cidByAssetId, 'iconAsset');

  const body = renderIconBody(block.type, values, iconUrl);

  return `
    <mj-column background-color="${escapeHtml(backgroundColor)}" padding="0">
      <mj-table padding="0">
        <tr>
          <td
            style="${buildBackgroundStyle(backgroundColor, backgroundImage)}"
            ${backgroundImage ? `background="${escapeHtml(backgroundImage)}"` : ''}
          >
            ${body}
          </td>
        </tr>
      </mj-table>
    </mj-column>
  `;
}

function isIconEmailBlock(type: string): type is IconEmailBlockType {
  return (
    type === 'iconBoxBackgroundFull' ||
    type === 'iconCenterBackgroundFull' ||
    type === 'iconLeftBackgroundFull' ||
    type === 'iconRightBackgroundFull'
  );
}

function renderIconBody(
  type: IconEmailBlockType,
  values: Partial<Record<string, string>>,
  iconUrl: string | null,
): string {
  const label =
    values.label ??
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

  if (type === 'iconCenterBackgroundFull') {
    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center" style="padding:32px 48px 12px;">
            ${renderIcon(iconUrl, 48)}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 48px 32px;">
            ${renderText(label, values, 'center')}
          </td>
        </tr>
      </table>
    `;
  }

  if (type === 'iconLeftBackgroundFull') {
    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding:32px 48px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td width="48" valign="middle">
                  ${renderIcon(iconUrl, 40)}
                </td>
                <td valign="middle" style="padding-left:12px;">
                  ${renderText(label, values, 'left')}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  if (type === 'iconRightBackgroundFull') {
    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding:32px 48px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td valign="middle" align="right" style="padding-right:12px;">
                  ${renderText(label, values, 'right')}
                </td>
                <td width="48" valign="middle" align="right">
                  ${renderIcon(iconUrl, 40)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  return renderIconBox(values, iconUrl);
}

function renderIconBox(
  values: Partial<Record<string, string>>,
  iconUrl: string | null,
): string {
  const label =
    values.label ??
    'Lorem ipsum dolor sit amet consectetur.';

  const items = defaultIconItems;

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding:28px 48px 16px;">
          ${renderText(label, values, 'center')}
        </td>
      </tr>
      <tr>
        <td style="padding:0 48px 28px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              ${renderIconBoxItem(items[0], values, iconUrl)}
              ${renderIconBoxItem(items[1], values, iconUrl)}
            </tr>
            <tr>
              ${renderIconBoxItem(items[2], values, iconUrl)}
              ${renderIconBoxItem(items[3], values, iconUrl)}
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function renderIconBoxItem(
  text: string,
  values: Partial<Record<string, string>>,
  iconUrl: string | null,
): string {
  return `
    <td width="50%" valign="top" style="padding:8px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td width="40" valign="top">
            ${renderIcon(iconUrl, 32)}
          </td>
          <td valign="top" style="padding-left:10px;">
            ${renderText(text, values, 'left')}
          </td>
        </tr>
      </table>
    </td>
  `;
}

function renderIcon(iconUrl: string | null, size: number): string {
  if (iconUrl) {
    return `
      <img
        src="${escapeHtml(iconUrl)}"
        alt="Icon"
        width="${size}"
        height="${size}"
        style="display:block;width:${size}px;height:${size}px;object-fit:contain;border:0;"
      />
    `;
  }

  return `
    <table role="presentation" width="${size}" height="${size}" cellspacing="0" cellpadding="0" border="0" style="background-color:#F2F1EE;">
      <tr>
        <td align="center" valign="middle" style="font-family:Arial,sans-serif;font-size:${Math.max(16, size - 16)}px;font-weight:700;color:#C8C5BF;">
          i
        </td>
      </tr>
    </table>
  `;
}

function renderText(
  text: string,
  values: Partial<Record<string, string>>,
  align: 'left' | 'center' | 'right',
): string {
  return `
    <div style="${resolveTextStyle(values)};text-align:${align};">
      ${escapeHtml(text)}
    </div>
  `;
}

function resolveTextStyle(values: Partial<Record<string, string>>): string {
  const fontSize = values.labelFontSize ?? values.fontSize ?? '16px';
  const fontFamily = values.labelFontFamily ?? values.fontFamily ?? 'Arial';
  const typographyStyle = values.typographyStyle ?? '';
  const normalizedFontFamily = fontFamily.toLowerCase();

  const isBold =
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
    `color:${defaultTextColor}`,
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
