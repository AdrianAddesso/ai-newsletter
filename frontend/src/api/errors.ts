import { isAxiosError } from 'axios'

export function toApiError(
  error: unknown,
  fallbackMessage: string,
): Error {
  if (isAxiosError(error)) {
    const responseData = error.response?.data

    if (
      responseData &&
      typeof responseData === 'object' &&
      'message' in responseData &&
      typeof responseData.message === 'string' &&
      responseData.message.trim()
    ) {
      return new Error(responseData.message.trim())
    }

    if (!error.response) {
      return new Error('El servidor no responde. Intentá nuevamente.')
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error
  }

  return new Error(fallbackMessage)
}
