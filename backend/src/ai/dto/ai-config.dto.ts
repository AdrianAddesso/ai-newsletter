import { z } from 'zod';
import { ai_config_type } from '@prisma/client';

export const updateAiConfigBodySchema = z
    .object({
        temperature: z.number().min(0).max(1),
        top_p: z.number().min(0).max(1),
        top_k: z.number().int().min(1),
        max_output_tokens: z.number().int().min(1).max(8192),
    })
    .strict();

export type UpdateAiConfigDto = z.infer<typeof updateAiConfigBodySchema>;

export interface AiConfigResponseDto {
    id: string;
    name: string;
    type: ai_config_type;
    temperature: number;
    top_p: number;
    top_k: number;
    max_output_tokens: number;
    created_at: Date;
    updated_at: Date;
}
