import type { NewsletterBlockDto } from '../../../blocks/newsletter-blocks';
import { parseBlockValues } from '../../../blocks/newsletter-blocks';

type ContentEmailBlockType =
  | 'labelCenterBackgroundFull'
  | 'labelLeftBackgroundFull'
  | 'labelLeftBackgroundSmall'
  | 'labelTextLabelCenterFull'
  | 'textCenterBackgroundFull'
  | 'textDoubleCenterBackgroundFull'
  | 'textLabelCenterBackgroundFull'
  | 'textLeftBackgroundFull';

type RenderContentEmailOptions = {
  cidByAssetId: Map<string, string>;
};

const defaultBackgroundColor = '#ffffff';
const defaultTextColor = '#30261D';
const labelBackgroundColor = '#FFC800';
const labelTextColor = '#30261D';

export function renderContentEmail(
  block: NewsletterBlockDto,
  options: RenderContentEmailOptions,
): string {
  if (!isContentEmailBlock(block.type)) {
    return '';
  }

  const values = parseBlockValues(block.content);
  const backgroundColor = values.bgColor ?? defaultBackgroundColor;
  const backgroundImage = resolveBackgroundImage(block, options.cidByAssetId);

  const body = renderContentBody(block.type, values);

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

function isContentEmailBlock(type: string): type is ContentEmailBlockType {
  return (
    type === 'labelCenterBackgroundFull' ||
    type === 'labelLeftBackgroundFull' ||
    type === 'labelLeftBackgroundSmall' ||
    type === 'labelTextLabelCenterFull' ||
    type === 'textCenterBackgroundFull' ||
    type === 'textDoubleCenterBackgroundFull' ||
    type === 'textLabelCenterBackgroundFull' ||
    type === 'textLeftBackgroundFull'
  );
}

function renderContentBody(
  type: ContentEmailBlockType,
  values: Partial<Record<string, string>>,
): string {
  switch (type) {
    case 'labelCenterBackgroundFull':
      return renderCenteredLabel(values.label ?? 'Lorem ipsum dolor sit amet', values, 'label', {
        padding: '32px 24px',
      });

    case 'labelLeftBackgroundFull':
      return renderLeftLabel(values.label ?? 'Lorem ipsum dolor sit amet', values, 'label', {
        padding: '32px 48px',
      });

    case 'labelLeftBackgroundSmall':
      return renderLeftLabel(values.label ?? 'Lorem ipsum dolor sit amet', values, 'label', {
        padding: '18px 48px',
      });

    case 'labelTextLabelCenterFull':
      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding:24px 48px 8px;">
              ${renderLabel(values.topLabel ?? 'Lorem ipsum dolor sit amet', values, 'topLabel')}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 48px;">
              ${renderText(
                values.bodyText ??
                  'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.',
                values,
                'bodyText',
                'center',
              )}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 48px 24px;">
              ${renderLabel(values.bottomLabel ?? 'Consectetur adipiscing elit', values, 'bottomLabel')}
            </td>
          </tr>
        </table>
      `;

    case 'textCenterBackgroundFull':
      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding:32px 48px;">
              ${renderText(
                values.text ??
                  'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.',
                values,
                'text',
                'center',
              )}
            </td>
          </tr>
        </table>
      `;

    case 'textDoubleCenterBackgroundFull':
      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding:28px 48px 10px;">
              ${renderText(
                values.primaryText ??
                  'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.',
                values,
                'primaryText',
                'center',
              )}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:10px 48px 28px;">
              ${renderText(
                values.secondaryText ??
                  'Consequuntur eum voluptas iure repellat voluptate, nisi ipsam explicabo fugit architecto sint adipisci.',
                values,
                'secondaryText',
                'center',
              )}
            </td>
          </tr>
        </table>
      `;

    case 'textLabelCenterBackgroundFull':
      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding:28px 48px 10px;">
              ${renderText(
                values.text ??
                  'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.',
                values,
                'text',
                'center',
              )}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:10px 48px 28px;">
              ${renderLabel(values.label ?? 'Lorem ipsum dolor sit amet', values, 'label')}
            </td>
          </tr>
        </table>
      `;

    case 'textLeftBackgroundFull':
      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="left" style="padding:32px 48px;">
              ${renderText(
                values.text ??
                  'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.',
                values,
                'text',
                'left',
              )}
            </td>
          </tr>
        </table>
      `;
  }
}

function renderCenteredLabel(
  label: string,
  values: Partial<Record<string, string>>,
  fieldKey: string,
  options: { padding: string },
): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding:${options.padding};">
          ${renderLabel(label, values, fieldKey)}
        </td>
      </tr>
    </table>
  `;
}

function renderLeftLabel(
  label: string,
  values: Partial<Record<string, string>>,
  fieldKey: string,
  options: { padding: string },
): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="left" style="padding:${options.padding};">
          ${renderLabel(label, values, fieldKey)}
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
          style="${textStyle};background-color:${labelBackgroundColor};border-radius:8px;padding:6px 14px;border-right:4px solid #E6B300;border-bottom:4px solid #E6B300;box-shadow:4px 4px 0 #E6B300;"
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
  align: 'left' | 'center',
): string {
  return `
    <div style="${resolveTextStyle(values, fieldKey, {
      fallbackFontSize: '16px',
      defaultBold: false,
      color: defaultTextColor,
    })};text-align:${align};">
      ${escapeHtml(text)}
    </div>
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

  const fontFamilyIsBold = normalizedFontFamily.includes('bold');
  const fontFamilyIsItalic = normalizedFontFamily.includes('italic');
  const fontFamilyIsCondensed = normalizedFontFamily.includes('cnd') || normalizedFontFamily.includes('condensed');

  const isBold = options.defaultBold || typographyStyle.includes('bold') || fontFamilyIsBold;
  const isItalic = typographyStyle.includes('italic') || fontFamilyIsItalic;

  const fallbackFontFamily = fontFamilyIsCondensed
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

function resolveBackgroundImage(
  block: NewsletterBlockDto,
  cidByAssetId: Map<string, string>,
): string | null {
  const backgroundBinding = block.assetBindings.find(
    (assetBinding) => assetBinding.fieldKey === 'backgroundAsset',
  );

  if (!backgroundBinding) {
    return null;
  }

  const cid = cidByAssetId.get(backgroundBinding.assetId);

  if (cid) {
    return `cid:${cid}`;
  }

  return backgroundBinding.assetUrl ?? null;
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