import axios from 'axios'
import type { AreaName } from '../types/newsletter'

export type ImproveTextRequest = {
  text: string
}

export type ImproveTextResponse = {
  originalText: string
  improvedText: string
}

export type GeneratedNewsletterBlock = {
  id: string
  name: string
  text: string
  backgroundColor: string
}

export type GenerateNewsletterRequest = {
  area: AreaName
  templateId: string
  brandKitId: string
  topic: string
  objective: string
  audience: string
  keyMessages: string[]
  tone: string
  relevantDates?: string
  cta?: string
  contact?: string
  linksOrSources: string[]
  additionalContext?: string
  assetIds: string[]
}

export type GenerateNewsletterResponse = {
  blocks: GeneratedNewsletterBlock[]
}

import { AiConfigType } from "@shared/enums/ai-config-type.enum";
export type { AiConfigType };

export type AiConfig = {
    id: string;
    name: string;
    type: AiConfigType;
    temperature: number;
    top_p: number;
    top_k: number;
    max_output_tokens: number;
    created_at: string;
    updated_at: string;
};

export type CreateAiConfigRequest = {
    name: string;
    type: AiConfigType;
    temperature: number;
    top_p: number;
    top_k: number;
    max_output_tokens: number;
};

export type UpdateAiConfigRequest = {
    temperature: number;
    top_p: number;
    top_k: number;
    max_output_tokens: number;
};

export async function improveText(
    request: ImproveTextRequest,
    ): Promise<ImproveTextResponse> {
    const response = await axios.post<ImproveTextResponse>('/ai/improve-text', request)

    return response.data
}

export async function generateNewsletter(
    request: GenerateNewsletterRequest,
    ): Promise<GenerateNewsletterResponse> {
    const response = await axios.post<GenerateNewsletterResponse>(
        '/ai/generate-newsletter',
        request,
    )

    return response.data
}

export async function getAiConfigs(): Promise<AiConfig[]> {
    const response = await axios.get<AiConfig[]>("/ai/ai-config");
    return response.data;
}

export async function createAiConfig(
    request: CreateAiConfigRequest,
): Promise<AiConfig> {
    const response = await axios.post<AiConfig>("/ai/ai-config", request);
    return response.data;
}

export async function updateAiConfig(
    id: string,
    request: UpdateAiConfigRequest,
): Promise<AiConfig> {
    const response = await axios.patch<AiConfig>(`/ai/ai-config/${id}`, request);
    return response.data;
}

export async function deleteAiConfig(id: string): Promise<void> {
    await axios.delete(`/ai/ai-config/${id}`);
}
