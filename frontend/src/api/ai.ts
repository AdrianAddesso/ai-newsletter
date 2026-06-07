import axios, { isAxiosError } from "axios";
import { AiConfigType } from "@shared/enums/ai-config-type.enum";
import type { AreaName, NewsletterBlock } from "../types/newsletter";

export type ImproveTextRequest = {
  text: string;
};

export type ImproveTextResponse = {
  originalText: string;
  improvedText: string;
};

export type GenerateNewsletterRequest = {
  area: AreaName;
  templateId: string;
  brandKitId: string;
  topic: string;
  objective: string;
  audience: string;
  keyMessages: string[];
  tone: string;
  relevantDates?: string;
  cta?: string;
  contact?: string;
  linksOrSources: string[];
  additionalContext?: string;
  assetIds: string[];
};

export type GenerateNewsletterResponse = {
  blocks: NewsletterBlock[];
};

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

export type PromptCommand = {
  id: string;
  name: string;
  type: AiConfigType;
  display_order: number;
  instruction: string | null;
  created_at: string;
  updated_at: string;
};

export type CreatePromptCommandRequest = {
  name: string;
  type: AiConfigType;
  display_order: number;
  instruction?: string;
};

export type UpdatePromptCommandRequest = {
  name?: string;
  display_order?: number;
  instruction?: string;
};

export async function improveText(
  request: ImproveTextRequest,
  notifyError?: (message: string) => void,
): Promise<ImproveTextResponse> {
  try {
    const response = await axios.post<ImproveTextResponse>(
      "/ai/improve-text",
      request,
    );
    return response.data;
  } catch (error) {
    handleAiRequestError(error, notifyError);
    throw error;
  }
}

export async function generateNewsletter(
  request: GenerateNewsletterRequest,
  notifyError?: (message: string) => void,
): Promise<GenerateNewsletterResponse> {
  try {
    const response = await axios.post<GenerateNewsletterResponse>(
      "/ai/generate-newsletter",
      request,
    );
    return response.data;
  } catch (error) {
    handleAiRequestError(error, notifyError);
    throw error;
  }
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

export async function getPromptCommands(
  type?: AiConfigType,
): Promise<PromptCommand[]> {
  const response = await axios.get<PromptCommand[]>("/ai/prompt-commands", {
    params: type ? { type } : undefined,
  });
  return response.data;
}

export async function createPromptCommand(
  request: CreatePromptCommandRequest,
): Promise<PromptCommand> {
  const response = await axios.post<PromptCommand>(
    "/ai/prompt-commands",
    request,
  );
  return response.data;
}

export async function updatePromptCommand(
  id: string,
  request: UpdatePromptCommandRequest,
): Promise<PromptCommand> {
  const response = await axios.patch<PromptCommand>(
    `/ai/prompt-commands/${id}`,
    request,
  );
  return response.data;
}

export async function deletePromptCommand(id: string): Promise<void> {
  await axios.delete(`/ai/prompt-commands/${id}`);
}

function handleAiRequestError(
  error: unknown,
  notifyError?: (message: string) => void,
): void {
  if (!isAxiosError(error)) {
    return;
  }

  if (!error.response) {
    console.error("No response from API:", error.message);
    notifyError?.(
      "El servidor no responde. Verifica tu conexión o intenta más tarde.",
    );
    return;
  }

  const serverMessage = extractAxiosErrorMessage(error);
  if (serverMessage) {
    notifyError?.(serverMessage);
  }
}

function extractAxiosErrorMessage(error: unknown): string | null {
  if (!isAxiosError(error)) {
    return null;
  }

  const responseData = error.response?.data;

  if (
    responseData &&
    typeof responseData === "object" &&
    "message" in responseData &&
    typeof responseData.message === "string" &&
    responseData.message.trim()
  ) {
    return responseData.message.trim();
  }

  return null;
}
