import type { NewsletterBlockDto } from '../../../blocks/newsletter-blocks';
import { parseBlockValues } from '../../../blocks/newsletter-blocks';

type HeaderLogoPlacement = 'left' | 'right' | 'both';

type RenderHeaderEmailOptions = {
  logoPlacement: HeaderLogoPlacement;
  cidByAssetId: Map<string, string>;
};

const headerBackgroundColor = '#FF595A';
const headerLogoHeight = 60;
const defaultHeaderLogoCid = 'newsletter-default-header-logo@nestle-ai-newsletter';

export function renderHeaderEmail(
  block: NewsletterBlockDto,
  options: RenderHeaderEmailOptions,
): string {
  const values = parseBlockValues(block.content);
  const { title = '', subtitle = '' } = values;

  const leftLogo = resolveHeaderLogo(block, options.cidByAssetId, [
    'leftLogoAsset',
    'logoAsset',
  ]) ?? resolveDefaultHeaderLogo();

  const rightLogo = resolveHeaderLogo(block, options.cidByAssetId, [
    'rightLogoAsset',
    'logoAsset',
  ]) ?? resolveDefaultHeaderLogo();

  const textColumn = renderHeaderText(title, subtitle, values);

  if (options.logoPlacement === 'left') {
    return `
      <mj-column background-color="${headerBackgroundColor}" padding="0">
        <mj-table padding="12px 16px">
          <tr>
            <td align="left" style="vertical-align:middle;">
              ${renderHeaderImage(leftLogo, 'Logo')}
            </td>
            <td align="left" style="vertical-align:middle;padding-left:12px;">
              ${textColumn}
            </td>
          </tr>
        </mj-table>
      </mj-column>
    `;
  }

  if (options.logoPlacement === 'right') {
    return `
      <mj-column background-color="${headerBackgroundColor}" padding="0">
        <mj-table padding="12px 16px">
          <tr>
            <td align="right" style="vertical-align:middle;padding-right:12px;">
              ${textColumn}
            </td>
            <td align="right" style="vertical-align:middle;">
              ${renderHeaderImage(rightLogo, 'Logo')}
            </td>
          </tr>
        </mj-table>
      </mj-column>
    `;
  }

  return `
    <mj-column background-color="${headerBackgroundColor}" padding="0">
      <mj-table padding="12px 16px">
        <tr>
          <td align="left" style="vertical-align:middle;">
            ${renderHeaderImage(leftLogo, 'Left logo')}
          </td>
          <td align="center" style="vertical-align:middle;padding:0 12px;">
            ${textColumn}
          </td>
          <td align="right" style="vertical-align:middle;">
            ${renderHeaderImage(rightLogo, 'Right logo')}
          </td>
        </tr>
      </mj-table>
    </mj-column>
  `;
}

function resolveHeaderLogo(
  block: NewsletterBlockDto,
  cidByAssetId: Map<string, string>,
  fieldKeys: string[],
): string | null {
  for (const fieldKey of fieldKeys) {
    const binding = block.assetBindings.find(
      (assetBinding) => assetBinding.fieldKey === fieldKey,
    );

    if (!binding) {
      continue;
    }

    const cid = cidByAssetId.get(binding.assetId);

    if (cid) {
      return `cid:${cid}`;
    }

    if (binding.assetUrl) {
      return binding.assetUrl;
    }
  }

  return null;
}

function resolveDefaultHeaderLogo(): string {
  return `cid:${defaultHeaderLogoCid}`;
}

function renderHeaderImage(src: string | null, alt: string): string {
  if (!src) {
    return '';
  }

  return `
    <img
      src="${escapeHtml(src)}"
      alt="${escapeHtml(alt)}"
      height="${headerLogoHeight}"
      style="display:block;height:${headerLogoHeight}px;width:auto;border:0;"
    />
  `;
}

function renderHeaderText(
  title: string,
  subtitle: string,
  values: Partial<Record<string, string>>,
): string {
  if (!title && !subtitle) {
    return '';
  }

  const titleStyle = resolveHeaderTextStyle(values, 'title', '14px', true);
  const subtitleStyle = resolveHeaderTextStyle(values, 'subtitle', '12px', false);

  return `
    ${
      title
        ? `<div style="${titleStyle}">${escapeHtml(title)}</div>`
        : ''
    }
    ${
      subtitle
        ? `<div style="${subtitleStyle}">${escapeHtml(subtitle)}</div>`
        : ''
    }
  `;
}

function resolveHeaderTextStyle(
  values: Partial<Record<string, string>>,
  fieldKey: string,
  fallbackFontSize: string,
  defaultBold: boolean,
): string {
  const fontSize =
    values[`${fieldKey}FontSize`] ??
    values.fontSize ??
    fallbackFontSize;

  const fontFamily =
    values[`${fieldKey}FontFamily`] ??
    values.fontFamily ??
    'Arial';

  const typographyStyle = values.typographyStyle ?? '';
  const isBold = defaultBold || typographyStyle.includes('bold');
  const isItalic = typographyStyle.includes('italic');

  return [
    `font-family:${escapeCssValue(fontFamily)}, Arial, sans-serif`,
    `font-size:${escapeCssValue(fontSize)}`,
    `font-weight:${isBold ? '700' : '400'}`,
    `font-style:${isItalic ? 'italic' : 'normal'}`,
    'line-height:1.2',
    'color:#ffffff',
  ].join(';');
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