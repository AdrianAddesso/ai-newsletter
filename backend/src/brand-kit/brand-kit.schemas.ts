import { z } from 'zod';
import {
  optionalBooleanFieldSchema,
  requiredStringFieldSchema,
  uuidFieldSchema,
} from '../common/zod/field-schemas';

export const createBrandKitBodySchema = z
  .object({
    fontId: uuidFieldSchema.optional(),
    createdByUserId: uuidFieldSchema.optional(),
    name: requiredStringFieldSchema,
    active: optionalBooleanFieldSchema,
  })
  .strict();

export const updateBrandKitBodySchema = createBrandKitBodySchema
  .partial()
  .strict();

export const brandKitColorHexSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Debe indicar un color HEX valido.');

export const createBrandKitColorBodySchema = z
  .object({
    name: requiredStringFieldSchema,
    hex: brandKitColorHexSchema,
  })
  .strict();

export const updateBrandKitColorBodySchema = createBrandKitColorBodySchema;

export type CreateBrandKitBody = z.infer<typeof createBrandKitBodySchema>;
export type UpdateBrandKitBody = z.infer<typeof updateBrandKitBodySchema>;
export type CreateBrandKitColorBody = z.infer<
  typeof createBrandKitColorBodySchema
>;
export type UpdateBrandKitColorBody = z.infer<
  typeof updateBrandKitColorBodySchema
>;
