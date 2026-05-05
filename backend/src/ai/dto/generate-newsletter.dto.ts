import { area_name } from '@prisma/client';
import { z } from 'zod';

const requiredStringSchema = z
  .string()
  .trim()
  .min(1, 'Este campo es obligatorio.');

const optionalStringSchema = z
  .string()
  .trim()
  .optional();

const stringListSchema = z
  .array(requiredStringSchema)
  .optional()
  .default([]);

export const generateNewsletterBodySchema = z
  .object({
    area: z.nativeEnum(area_name, {
      error: 'Area invalida.',
    }),
    templateId: requiredStringSchema,
    topic: requiredStringSchema,
    objective: requiredStringSchema,
    audience: requiredStringSchema,
    keyMessages: stringListSchema.refine((messages) => messages.length > 0, {
      message: 'Debe ingresar al menos un mensaje clave.',
    }),
    tone: requiredStringSchema,
    relevantDates: optionalStringSchema,
    cta: optionalStringSchema,
    contact: optionalStringSchema,
    linksOrSources: stringListSchema,
    additionalContext: optionalStringSchema,
    assetIds: stringListSchema,
  })
  .strict();

export interface GeneratedNewsletterBlockDto {
  id: string;
  name: string;
  text: string;
  backgroundColor: string;
}

export interface GenerateNewsletterResponseDto {
  blocks: GeneratedNewsletterBlockDto[];
}

export type GenerateNewsletterRequestDto = z.infer<
  typeof generateNewsletterBodySchema
>;
