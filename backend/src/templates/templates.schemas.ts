import { area_name, asset_type, block_content_type, newsletter_format } from '@prisma/client';
import { z } from 'zod';
import {
  optionalBooleanFieldSchema,
  optionalIntegerFieldSchema,
  optionalStringFieldSchema,
  requiredStringFieldSchema,
  requiredUrlFieldSchema,
  uuidFieldSchema,
} from '../common/zod/field-schemas';

const areaNameSchema = z.nativeEnum(area_name, {
  error: 'Area invalida.',
});

const blockContentTypeSchema = z.nativeEnum(block_content_type, {
  error: 'Tipo de bloque invalido.',
});

const assetTypeSchema = z.nativeEnum(asset_type, {
  error: 'Tipo de asset invalido.',
});

export const createTemplateBodySchema = z
  .object({
    name: requiredStringFieldSchema,
    description: requiredStringFieldSchema,
    area: areaNameSchema,
    layout:
      z.array(
        z.object({
          block_type: z.string().nullable(),
          content: z.string().nullable(),
          row: z.number(),
          grid_column: z.number(),
          display_order: z.number(),
          mustFill: z.boolean().optional()
        })
      ).min(1, 'El layout debe contener al menos un bloque.'),
    state: requiredStringFieldSchema,
    promptBase: optionalStringFieldSchema,
    orientation: z.enum([newsletter_format.PORTRAIT, newsletter_format.LANDSCAPE])
  })
  .strict();

export const updateTemplateBodySchema = createTemplateBodySchema
  .partial()
  .strict();

export const updateTemplateStatusBodySchema = z
  .object({
    stateId: uuidFieldSchema,
  })
  .strict();

export const defineTemplateBlocksBodySchema = z
  .object({
    blocks: z
      .array(
        z
          .object({
            content: optionalStringFieldSchema.nullable(),
            displayOrder: optionalIntegerFieldSchema,
            mustFill: optionalBooleanFieldSchema,
            type: blockContentTypeSchema,
          })
          .strict(),
      )
      .min(1, 'Debe enviar al menos un bloque.'),
  })
  .strict();

export const addTemplateAssetBodySchema = z
  .object({
    name: requiredStringFieldSchema,
    url: requiredUrlFieldSchema,
    description: optionalStringFieldSchema,
    type: assetTypeSchema,
  })
  .strict();

export const updateTemplateAssetBodySchema = addTemplateAssetBodySchema
  .partial()
  .strict();

export const createAreaBodySchema = z
  .object({
    name: areaNameSchema,
  })
  .strict();

export type CreateTemplateBody = z.infer<typeof createTemplateBodySchema>;
export type UpdateTemplateBody = z.infer<typeof updateTemplateBodySchema>;
export type UpdateTemplateStatusBody = z.infer<
  typeof updateTemplateStatusBodySchema
>;
export type DefineTemplateBlocksBody = z.infer<
  typeof defineTemplateBlocksBodySchema
>;
export type AddTemplateAssetBody = z.infer<typeof addTemplateAssetBodySchema>;
export type UpdateTemplateAssetBody = z.infer<
  typeof updateTemplateAssetBodySchema
>;
export type CreateAreaBody = z.infer<typeof createAreaBodySchema>;
