import {
  newsletter_format,
  newsletter_language,
  newsletter_state,
} from '@prisma/client';
import { z } from 'zod';
import {
  optionalBooleanFieldSchema,
  optionalDateFieldSchema,
  optionalIntegerFieldSchema,
  optionalStringFieldSchema,
  optionalUrlFieldSchema,
  requiredStringFieldSchema,
  uuidFieldSchema,
} from '../common/zod/field-schemas';

const newsletterStateSchema = z.nativeEnum(newsletter_state, {
  error: 'Estado de newsletter invalido.',
});

const newsletterLanguageSchema = z.nativeEnum(newsletter_language, {
  error: 'Idioma de newsletter invalido.',
});

const newsletterFormatSchema = z.nativeEnum(newsletter_format, {
  error: 'Formato de newsletter invalido.',
});

const newsletterSelectedAssetSchema = z
  .object({
    id: uuidFieldSchema,
    keywordText: optionalStringFieldSchema.nullable().optional(),
  })
  .strict();

const newsletterAssetSelectionSchema = z
  .object({
    selectedAssets: z.array(newsletterSelectedAssetSchema),
  })
  .strict();

export const createNewsletterBodySchema = z
  .object({
    title: requiredStringFieldSchema,
    areaId: uuidFieldSchema.optional(),
    themeTag: optionalStringFieldSchema,
    publishDate: optionalDateFieldSchema,
    brandKitId: uuidFieldSchema.optional(),
    templateId: uuidFieldSchema.optional(),
    approvedByUserId: uuidFieldSchema.optional(),
    createdByUserId: uuidFieldSchema.optional(),
    state: newsletterStateSchema.optional(),
    language: newsletterLanguageSchema.optional(),
    format: newsletterFormatSchema.optional(),
    assetSelection: newsletterAssetSelectionSchema.optional(),
  })
  .strict();

export const updateNewsletterBodySchema = createNewsletterBodySchema
  .partial()
  .strict();

export const updateNewsletterStatusBodySchema = z
  .object({
    state: newsletterStateSchema,
    previousState: newsletterStateSchema.optional(),
    reviewedByUserId: uuidFieldSchema.optional(),
    allCommentaries: optionalStringFieldSchema,
  })
  .strict();

export const addNewsletterLogBodySchema = z
  .object({
    previousState: newsletterStateSchema.optional(),
    newState: newsletterStateSchema.optional(),
    reviewedByUserId: uuidFieldSchema.optional(),
    allCommentaries: optionalStringFieldSchema,
  })
  .strict();

export const addNewsletterCommentBodySchema = z
  .object({
    blockContentId: uuidFieldSchema.optional(),
    commentedByUserId: uuidFieldSchema.optional(),
    show: optionalBooleanFieldSchema,
    content: optionalStringFieldSchema,
  })
  .strict();

export const updateNewsletterCommentBodySchema = addNewsletterCommentBodySchema
  .partial()
  .strict();

export const updateNewsletterExportBodySchema = z
  .object({
    urlFile: optionalUrlFieldSchema,
  })
  .strict();

export const defineNewsletterBlockSchema = z
  .object({
    blockContentId: uuidFieldSchema,
    displayOrder: optionalIntegerFieldSchema,
    row: optionalIntegerFieldSchema,
    gridColumn: optionalIntegerFieldSchema,
  })
  .strict();

export type CreateNewsletterBody = z.infer<typeof createNewsletterBodySchema>;
export type UpdateNewsletterBody = z.infer<typeof updateNewsletterBodySchema>;
export type UpdateNewsletterStatusBody = z.infer<
  typeof updateNewsletterStatusBodySchema
>;
export type AddNewsletterLogBody = z.infer<typeof addNewsletterLogBodySchema>;
export type AddNewsletterCommentBody = z.infer<
  typeof addNewsletterCommentBodySchema
>;
export type UpdateNewsletterCommentBody = z.infer<
  typeof updateNewsletterCommentBodySchema
>;
export type UpdateNewsletterExportBody = z.infer<
  typeof updateNewsletterExportBodySchema
>;
export type DefineNewsletterBlock = z.infer<typeof defineNewsletterBlockSchema>;

export const exportNewsletterBodySchema = z.object({
  format: z.enum(['PDF', 'JPG', 'EML'], { error: 'Formato inválido. Usá PDF, JPG o EML.' }),
}).strict();
export type ExportNewsletterBody = z.infer<typeof exportNewsletterBodySchema>;
