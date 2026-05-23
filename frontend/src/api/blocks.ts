import axios from 'axios'
import type {
  BlockDefinitionDTO,
  BlockInstance,
} from '@shared/types/block.types'

export type SaveBlocksRequest = {
  blocks: Omit<BlockInstance, 'localId'>[]
}

export type SaveBlocksResponse = {
  templateId: string
  savedCount: number
}

export async function listBlockDefinitions(): Promise<BlockDefinitionDTO[]> {
  const response = await axios.get<BlockDefinitionDTO[]>('/blocks/definitions')

  return response.data
}

export async function saveBlocks(
    templateId: string,
    blocks: Omit<BlockInstance, 'localId'>[],
    ): Promise<SaveBlocksResponse> {
    const response = await axios.post<SaveBlocksResponse>(
        `/templates/${templateId}/blocks`,
        { blocks } satisfies SaveBlocksRequest,
    )

    return response.data
}
