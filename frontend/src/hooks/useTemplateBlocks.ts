import { useCallback, useState } from 'react'
import { saveBlocks } from '../api/blocks'
import type {
  BlockDefinitionDTO,
  BlockInstance,
} from '@shared/types/block.types'

type UseTemplateBlocksResult = {
  blocks: BlockInstance[]
  addBlock: (definition: BlockDefinitionDTO) => void
  removeBlock: (localId: string) => void
  saveTemplate: (templateId: string) => Promise<void>
}

export function useTemplateBlocks(): UseTemplateBlocksResult {
  const [blocks, setBlocks] = useState<BlockInstance[]>([])

  const addBlock = useCallback((definition: BlockDefinitionDTO) => {
    setBlocks((previousBlocks) => [
      ...previousBlocks,
      {
        localId: crypto.randomUUID(),
        type: definition.type,
        content: definition.defaultContent,
        mustFill: definition.mustFill,
        displayOrder: previousBlocks.length,
      },
    ])
  }, [])

  const removeBlock = useCallback((localId: string) => {
    setBlocks((previousBlocks) =>
      previousBlocks.filter((block) => block.localId !== localId),
    )
  }, [])

  const saveTemplate = useCallback(
    async (templateId: string): Promise<void> => {
      await saveBlocks(
        templateId,
        blocks.map((block) => ({
          type: block.type,
          content: block.content,
          mustFill: block.mustFill,
          displayOrder: block.displayOrder,
        })),
      )
    },
    [blocks],
  )

  return { blocks, addBlock, removeBlock, saveTemplate }
}
