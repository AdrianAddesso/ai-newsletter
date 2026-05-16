import { newsletter_state } from '@prisma/client';
import { createBrandKitBodySchema } from '../../brand-kit/brand-kit.schemas';
import {
  createNewsletterBodySchema,
  updateNewsletterStatusBodySchema,
} from '../../newsletters/newsletters.schemas';
import { createTemplateBodySchema } from '../../templates/templates.schemas';

describe('request body schemas', () => {
  it('accepts a valid newsletter creation payload', () => {
    const result = createNewsletterBodySchema.safeParse({
      title: 'Newsletter de abril',
      state: newsletter_state.DRAFT,
      language: 'SPA',
      format: 'PORTRAIT',
      areaId: '550e8400-e29b-41d4-a716-446655440000',
      assetSelection: {
        selectedAssets: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            keywordText: 'Hola',
          },
        ],
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects newsletter asset payloads with non-persisted fields', () => {
    const result = createNewsletterBodySchema.safeParse({
      title: 'Newsletter de abril',
      assetSelection: {
        selectedAssets: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            keywordText: 'Hola',
            svgTemplate: '<svg />',
          },
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid newsletter status payload', () => {
    const result = updateNewsletterStatusBodySchema.safeParse({
      state: 'INVALID_STATE',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid template payload', () => {
    const result = createTemplateBodySchema.safeParse({
      name: 'Template principal',
      stateId: 'invalid-uuid',
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid brand kit payload', () => {
    const result = createBrandKitBodySchema.safeParse({
      name: 'Kit corporativo',
      active: true,
    });

    expect(result.success).toBe(true);
  });
});
