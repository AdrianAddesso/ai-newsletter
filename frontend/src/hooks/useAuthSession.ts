import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'

import {
  getCurrentUser,
  getGoogleLoginUrl,
  logoutSession,
  refreshSession as refreshAuthSession,
  type AuthUser,
} from '../api/auth'

export interface AuthSessionValue {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  startGoogleLogin: () => void
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  fetchMe: () => Promise<void>
}

const refreshRequestUrl = '/auth/refresh'

export function useAuthSession(): AuthSessionValue {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchMe = useCallback(async (): Promise<void> => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
      throw new Error('No autenticado')
    }
  }, [])

  const startGoogleLogin = useCallback((): void => {
    window.location.href = getGoogleLoginUrl()
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutSession()
    } finally {
      setUser(null)
    }
  }, [])

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      await refreshAuthSession()
      await fetchMe()
    } catch {
      setUser(null)
      throw new Error('La sesion expiro')
    }
  }, [fetchMe])

  useEffect(() => {
    let mounted = true

    const initAuth = async (): Promise<void> => {
      try {
        await fetchMe()
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void initAuth()

    return () => {
      mounted = false
    }
  }, [fetchMe])

  useEffect(() => {
    const retriedRequests = new WeakSet<object>()

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        if (!axios.isAxiosError(error)) {
          return Promise.reject(error)
        }

        const originalRequest = error.config

        if (
          error.response?.status !== 401 ||
          !originalRequest ||
          originalRequest.url === refreshRequestUrl ||
          retriedRequests.has(originalRequest)
        ) {
          return Promise.reject(error)
        }

        retriedRequests.add(originalRequest)

        try {
          await refreshSession()
          return axios(originalRequest)
        } catch (refreshError: unknown) {
          setUser(null)
          return Promise.reject(refreshError)
        }
      },
    )

    return () => {
      axios.interceptors.response.eject(interceptor)
    }
  }, [refreshSession])

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    startGoogleLogin,
    logout,
    refreshSession,
    fetchMe,
  }
}
