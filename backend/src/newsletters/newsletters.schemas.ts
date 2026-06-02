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

const newsletterAssetBindingSchema = z
  .object({
    fieldKey: requiredStringFieldSchema,
    assetId: uuidFieldSchema,
    keywordText: optionalStringFieldSchema.nullable().optional(),
  })
  .strict();

const newsletterEditableBlockSchema = z
  .object({
    id: requiredStringFieldSchema,
    type: requiredStringFieldSchema,
    category: z.string().optional(),
    name: optionalStringFieldSchema.optional(),
    content: optionalStringFieldSchema.nullable().optional(),
    row: optionalIntegerFieldSchema,
    gridColumn: optionalIntegerFieldSchema,
    displayOrder: optionalIntegerFieldSchema,
    mustFill: optionalBooleanFieldSchema,
    comment: optionalStringFieldSchema.nullable().optional(),
    assetBindings: z.array(newsletterAssetBindingSchema).optional(),
  })
  .strict();

const newsletterGenerationContentSchema = z
  .object({
    aiContent: z.unknown(),
    originalContent: z.unknown(),
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
    generationContent: newsletterGenerationContentSchema.optional(),
    blocks: z.array(newsletterEditableBlockSchema).optional(),
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

const reviewBlockCommentSchema = z
  .object({
    blockId: uuidFieldSchema,
    content: requiredStringFieldSchema,
  })
  .strict();

export const requestNewsletterChangesBodySchema = z
  .object({
    blockComments: z.array(reviewBlockCommentSchema).min(1, {
      error: 'Debe indicar al menos un comentario.',
    }),
  })
  .strict();

export const approveNewsletterReviewBodySchema = z
  .object({})
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
export type RequestNewsletterChangesBody = z.infer<
  typeof requestNewsletterChangesBodySchema
>;
export type ApproveNewsletterReviewBody = z.infer<
  typeof approveNewsletterReviewBodySchema
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
export type NewsletterEditableBlock = z.infer<
  typeof newsletterEditableBlockSchema
>;
export type NewsletterAssetBinding = z.infer<
  typeof newsletterAssetBindingSchema
>;
export type ReviewBlockComment = z.infer<typeof reviewBlockCommentSchema>;
