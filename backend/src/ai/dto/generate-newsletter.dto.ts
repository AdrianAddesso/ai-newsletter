import { area_name } from '@prisma/client';
import type {
  BlockAssetType,
  BlockContentType,
  BlockEditField,
} from '@shared/types/block.types';
import { z } from 'zod';

const requiredStringSchema = z
  .string()
  .trim()
  .min(1, 'Este campo es obligatorio.');

const optionalStringSchema = z.string().trim().optional();

const stringListSchema = z.array(requiredStringSchema).optional().default([]);

export const generateNewsletterBodySchema = z
  .object({
    area: z.nativeEnum(area_name, {
      error: 'Area invalida.',
    }),
    templateId: requiredStringSchema,
    brandKitId: requiredStringSchema,
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
  type: string;
  category: BlockContentType;
  name: string;
  content: string | null;
  row: number;
  gridColumn: number;
  displayOrder: number;
  mustFill: boolean;
  comment: string | null;
  editFields: BlockEditField[];
  assetBindings: GeneratedNewsletterAssetBindingDto[];
}

export interface GeneratedNewsletterAssetBindingDto {
  fieldKey: string;
  assetId: string;
  assetName: string | null;
  assetUrl: string | null;
  assetType: BlockAssetType;
  keywordText?: string | null;
}

export interface GenerateNewsletterResponseDto {
  blocks: GeneratedNewsletterBlockDto[];
}

export type GenerateNewsletterRequestDto = z.infer<
  typeof generateNewsletterBodySchema
>;
