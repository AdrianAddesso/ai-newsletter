import axios from "axios";
import { toApiError } from "./errors";
import type {
  BlockReviewComment,
  CreateNewsletterPayload,
  Newsletter,
  NewslettersAnalyticsResponse,
  NewsletterBlock,
  NewsletterListItem,
  ReviewInboxItem,
  UpdateNewsletterPayload,
} from "../types/newsletter";

export type NewsletterStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "CHANGES_REQUESTED"
  | "RESUBMITTED"
  | "APPROVED"
  | "DISCARDED";

const API_BASE = "/newsletters";

function createBody(payload: CreateNewsletterPayload) {
  return {
    title: payload.title ?? "Newsletter sin titulo",
    createdByUserId: payload.creatorUserId,
    templateId: payload.templateId,
    brandKitId: payload.brandKitId,
    format: payload.format,
    blocks: toPersistedBlocks(payload.blocks),
    generationContent: payload.generationContent,
  };
}

function updateBody(payload: UpdateNewsletterPayload) {
  const { title, templateId, brandKitId, format, blocks, state, generationContent } =
    payload;

  return {
    title,
    templateId,
    brandKitId,
    format,
    blocks: blocks ? toPersistedBlocks(blocks) : undefined,
    state,
    generationContent,
  };
}

function toPersistedBlocks(blocks: NewsletterBlock[]) {
  return blocks.map((block) => ({
    id: block.id,
    type: block.type,
    category: block.category,
    name: block.name,
    content: block.content,
    row: block.row,
    gridColumn: block.gridColumn,
    displayOrder: block.displayOrder,
    mustFill: block.mustFill,
    comment: block.comment,
    assetBindings: block.assetBindings.map((binding) => ({
      fieldKey: binding.fieldKey,
      assetId: binding.assetId,
      keywordText: binding.keywordText ?? null,
    })),
  }));
}

export async function createNewsletter(
  payload: CreateNewsletterPayload,
): Promise<Newsletter> {
  try {
    const response = await axios.post<Newsletter>(
      API_BASE,
      createBody(payload),
    );
    return response.data;
  } catch (error) {
    throw toApiError(error, "No se pudo crear el newsletter");
  }
}

export async function getNewsletter(id: string): Promise<Newsletter> {
  try {
    const response = await axios.get<Newsletter>(`${API_BASE}/${id}`);
    return response.data;
  } catch (error) {
    throw toApiError(error, "No se pudo cargar el newsletter");
  }
}

export async function updateNewsletter(
  id: string,
  payload: UpdateNewsletterPayload,
): Promise<Newsletter> {
  try {
    const response = await axios.patch<Newsletter>(
      `${API_BASE}/${id}`,
      updateBody(payload),
    );
    return response.data;
  } catch (error) {
    throw toApiError(error, "No se pudo actualizar el newsletter");
  }
}

export async function deleteNewsletter(id: string): Promise<void> {
  try {
    await axios.delete(`${API_BASE}/${id}`);
  } catch (error) {
    throw toApiError(error, "No se pudo eliminar el newsletter");
  }
}

export async function getAllNewsletters(): Promise<NewsletterListItem[]> {
  try {
    const response = await axios.get<{ data: NewsletterListItem[] }>(API_BASE);
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    throw toApiError(error, "No se pudieron cargar los newsletters");
  }
}

export async function updateNewsletterStatus(
  newsletterId: string,
  state: NewsletterStatus,
  comment?: string | null,
): Promise<Newsletter> {
  try {
    const response = await axios.post<Newsletter>(
      `${API_BASE}/${newsletterId}/status`,
      {
        state,
        allCommentaries: comment ?? undefined,
      },
    );

    return response.data;
  } catch (error) {
    throw toApiError(error, "No se pudo actualizar el estado del newsletter");
  }
}

export async function getReviewInbox(): Promise<ReviewInboxItem[]> {
  try {
    const response = await axios.get<ReviewInboxItem[]>(`${API_BASE}/reviews`);
    return response.data;
  } catch (error) {
    throw toApiError(
      error,
      "No se pudieron cargar los newsletters pendientes de revisión",
    );
  }
}

export async function getNewslettersAnalytics(): Promise<NewslettersAnalyticsResponse> {
  try {
    const response = await axios.get<NewslettersAnalyticsResponse>(
      `${API_BASE}/analytics`,
    );

    return {
      newsletters: Array.isArray(response.data?.newsletters)
        ? response.data.newsletters
        : [],
      logs: Array.isArray(response.data?.logs)
        ? response.data.logs.map((log) => ({
            ...log,
            blockComments: Array.isArray(log.blockComments)
              ? log.blockComments
              : [],
          }))
        : [],
    };
  } catch (error) {
    throw toApiError(
      error,
      "No se pudieron cargar las métricas de newsletters",
    );
  }
}

export async function requestNewsletterChanges(
  newsletterId: string,
  blockComments: Array<{
    blockId: string;
    content: string;
  }>,
): Promise<Newsletter> {
  try {
    const response = await axios.post<Newsletter>(
      `${API_BASE}/${newsletterId}/review/request-changes`,
      {
        blockComments,
      },
    );

    return response.data;
  } catch (error) {
    throw toApiError(error, "No se pudo solicitar cambios");
  }
}

export async function approveNewsletterReview(
  newsletterId: string,
): Promise<Newsletter> {
  try {
    const response = await axios.post<Newsletter>(
      `${API_BASE}/${newsletterId}/review/approve`,
    );

    return response.data;
  } catch (error) {
    throw toApiError(error, "No se pudo aprobar el newsletter");
  }
}

export async function duplicateNewsletter(
  newsletterId: string,
  newTitle?: string,
): Promise<Newsletter> {
  try {
    const response = await axios.post<Newsletter>(
      `${API_BASE}/${newsletterId}/duplicate`,
      newTitle ? { title: newTitle } : {},
    );

    return response.data;
  } catch (error) {
    throw toApiError(error, "No se pudo duplicar el newsletter");
  }
}

export type NewsletterBlockSnapshotPayload = {
  blockId: string;
  dataUrl: string;
  width: number;
  height: number;
};

export async function exportNewsletterEml(
  newsletterId: string,
  snapshots: NewsletterBlockSnapshotPayload[] = [],
): Promise<Blob> {
  try {
    const response = await axios.post<Blob>(
      `${API_BASE}/${newsletterId}/export/eml`,
      {
        snapshots,
      },
      {
        responseType: "blob",
      },
    );

    return response.data;
  } catch (error) {
    throw toApiError(error, "No se pudo exportar el newsletter");
  }
}
