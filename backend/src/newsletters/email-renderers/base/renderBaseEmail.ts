import type { NewsletterBlockDto } from '../../../blocks/newsletter-blocks';
import { parseBlockValues } from '../../../blocks/newsletter-blocks';

const ctaMainColor = '#FF595A';
const ctaMainTextColor = '#ffffff';
const ctaAlternativeTextColor = '#FF595A';
const emptyBackgroundColor = '#ffffff';

type BaseEmailBlockType = 'ctaFull' | 'ctaAlternative' | 'empty';

export function renderBaseEmail(block: NewsletterBlockDto): string {
  if (!isBaseEmailBlock(block.type)) {
    return '';
  }

  if (block.type === 'empty') {
    return renderEmptyEmail();
  }

  return renderCtaEmail(block);
}

function isBaseEmailBlock(type: string): type is BaseEmailBlockType {
  return type === 'ctaFull' || type === 'ctaAlternative' || type === 'empty';
}

function renderCtaEmail(block: NewsletterBlockDto): string {
  const values = parseBlockValues(block.content);
  const buttonLabel = values.buttonLabel ?? values.label ?? 'Click here';
  const href = values.href ?? '';

  if (block.type === 'ctaAlternative') {
    return `
      <mj-column background-color="#ffffff" padding="0">
        <mj-button
          href="${escapeHtml(href)}"
          background-color="#ffffff"
          color="${ctaAlternativeTextColor}"
          border="1px solid ${ctaMainColor}"
          border-radius="8px"
          font-weight="700"
          padding="16px"
          inner-padding="12px 28px"
        >
          ${escapeHtml(buttonLabel)}
        </mj-button>
      </mj-column>
    `;
  }

  return `
    <mj-column background-color="#ffffff" padding="0">
      <mj-button
        href="${escapeHtml(href)}"
        background-color="${ctaMainColor}"
        color="${ctaMainTextColor}"
        border-radius="8px"
        font-weight="700"
        padding="16px"
        inner-padding="12px 28px"
      >
        ${escapeHtml(buttonLabel)}
      </mj-button>
    </mj-column>
  `;
}

function renderEmptyEmail(): string {
  return `
    <mj-column background-color="${emptyBackgroundColor}" padding="0">
      <mj-spacer height="60px" />
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
