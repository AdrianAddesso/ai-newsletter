import { useCallback, useEffect, useState } from 'react'
import { listBlockDefinitions } from '../api/blocks'
import type { BlockDefinitionDTO } from '../../../packages/shared/src/types/block.types'

type UseBlockDefinitionsResult = {
  data: BlockDefinitionDTO[] | undefined
  error: Error | null
  isLoading: boolean
  refetch: () => Promise<void>
}

export function useBlockDefinitions(): UseBlockDefinitionsResult {
  const [data, setData] = useState<BlockDefinitionDTO[]>()
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchDefinitions = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      setData(await listBlockDefinitions())
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError
          : new Error('No se pudieron cargar los bloques disponibles.'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(fetchDefinitions)
  }, [fetchDefinitions])

  return { data, error, isLoading, refetch: fetchDefinitions }
}
