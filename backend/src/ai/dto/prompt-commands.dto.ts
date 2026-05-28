import { z } from 'zod';
import { ai_config_type } from '@prisma/client';

export const createPromptCommandBodySchema = z
    .object({
        name: z.string().trim().min(1, 'El nombre es obligatorio.'),
        type: z.nativeEnum(ai_config_type, { error: 'Tipo de prompt inválido.' }),
        display_order: z.number().int().min(0),
        instruction: z
        .string()
        .trim()
        .min(1, 'La instrucción es obligatoria.')
        .optional(),
    })
    .strict();

    export const updatePromptCommandBodySchema = z
    .object({
        name: z.string().trim().min(1).optional(),
        display_order: z.number().int().min(0).optional(),
        instruction: z.string().trim().min(1).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Se debe proporcionar al menos un campo para actualizar.',
    });

    export type CreatePromptCommandDto = z.infer<
    typeof createPromptCommandBodySchema
    >;
    export type UpdatePromptCommandDto = z.infer<
    typeof updatePromptCommandBodySchema
    >;

    export interface PromptCommandResponseDto {
    id: string;
    name: string;
    type: ai_config_type;
    display_order: number;
    instruction: string | null;
    created_at: Date;
    updated_at: Date;
}
