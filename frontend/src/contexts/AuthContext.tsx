/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import axios from 'axios'

export type UserRole = 'ADMIN' | 'FUNCTIONAL' | 'USER'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  area?: string
  state: 'ACTIVE' | 'INACTIVE' | 'REMOVED'
}

interface StoredSession {
  user: User
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: number
  refreshTokenExpiresAt: number
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithMicrosoft: (email: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

export const MICROSOFT_SSO_USERS: User[] = [
  {
    id: '1',
    email: 'superadmin@example.com',
    name: 'Administrador',
    role: 'ADMIN',
    area: 'COMUNICACION_INTERNA',
    state: 'ACTIVE'
  },
  {
    id: '2',
    email: 'funcional@example.com',
    name: 'Funcional',
    role: 'FUNCTIONAL',
    state: 'ACTIVE',
    area: 'COMUNICACION_CORPORATIVA'
  },
  {
    id: '3',
    email: 'user@example.com',
    name: 'Usuario Normal',
    role: 'USER',
    state: 'INACTIVE',
    area: 'COMUNICACION_INTERNA'
  },
]

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_STORAGE_KEY = 'nestle-ai-newsletter:session'
// MOCK_PASSWORD solo para desarrollo local/demo. No usar en producción.
const MOCK_PASSWORD = 'password123'
const ACCESS_TOKEN_TTL = 10 * 60 * 1000
const REFRESH_TOKEN_TTL = 8 * 60 * 60 * 1000

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })

const getUserByEmail = (email: string) =>
  MICROSOFT_SSO_USERS.find((mockUser) => mockUser.email === email)

const isExpired = (expiresAt: number) => Date.now() >= expiresAt

const createMockSession = (user: User): StoredSession => {
  const now = Date.now()

  return {
    user,
    accessToken: `ms_access_${user.id}_${now}`,
    refreshToken: `ms_refresh_${user.id}_${now}`,
    accessTokenExpiresAt: now + ACCESS_TOKEN_TTL,
    refreshTokenExpiresAt: now + REFRESH_TOKEN_TTL,
  }
}

const refreshStoredSession = (session: StoredSession): StoredSession => {
  const now = Date.now()

  return {
    ...session,
    accessToken: `ms_access_${session.user.id}_${now}`,
    refreshToken: `ms_refresh_${session.user.id}_${now}`,
    accessTokenExpiresAt: now + ACCESS_TOKEN_TTL,
    refreshTokenExpiresAt: now + REFRESH_TOKEN_TTL,
  }
}

const readStoredSession = (): StoredSession | null => {
  const storedSession = localStorage.getItem(SESSION_STORAGE_KEY)

  if (!storedSession) {
    return null
  }

  try {
    const parsedSession = JSON.parse(storedSession) as StoredSession

    if (!parsedSession.user || !parsedSession.accessToken || !parsedSession.refreshToken) {
      return null
    }

    return parsedSession
  } catch {
    return null
  }
}

const saveStoredSession = (session: StoredSession) => {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

const clearStoredSession = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

const setAxiosAccessToken = (accessToken?: string) => {
  if (accessToken) {
    axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    return
  }

  delete axios.defaults.headers.common.Authorization
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const commitSession = useCallback((session: StoredSession) => {
    saveStoredSession(session)
    setAxiosAccessToken(session.accessToken)
    setUser(session.user)
  }, [])

  const logout = useCallback(() => {
    clearStoredSession()
    setAxiosAccessToken()
    setUser(null)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedSession = readStoredSession()

      if (!storedSession) {
        setLoading(false)
        return
      }

      if (!isExpired(storedSession.accessTokenExpiresAt)) {
        commitSession(storedSession)
        setLoading(false)
        return
      }

      if (!isExpired(storedSession.refreshTokenExpiresAt)) {
        commitSession(refreshStoredSession(storedSession))
        setLoading(false)
        return
      }

      clearStoredSession()
      setAxiosAccessToken()
      setLoading(false)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [commitSession])

  const loginWithMicrosoft = useCallback(
    async (email: string) => {
      setLoading(true)

      try {
        await wait(500)

        const microsoftUser = getUserByEmail(email)

        if (!microsoftUser) {
          throw new Error('La cuenta Microsoft no tiene acceso al sistema')
        }

        commitSession(createMockSession(microsoftUser))
      } finally {
        setLoading(false)
      }
    },
    [commitSession],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      if (password !== MOCK_PASSWORD) {
        throw new Error('Credenciales invalidas')
      }

      await loginWithMicrosoft(email)
    },
    [loginWithMicrosoft],
  )

  const refreshToken = useCallback(async () => {
    const storedSession = readStoredSession()

    if (!storedSession || isExpired(storedSession.refreshTokenExpiresAt)) {
      logout()
      // Lanzar error para notificar al usuario
      throw new Error('La sesion expiro')
    }

    await wait(250)
    commitSession(refreshStoredSession(storedSession))
  }, [commitSession, logout])

  useEffect(() => {
    if (!user) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      const storedSession = readStoredSession()

      if (!storedSession) {
        logout()
        return
      }

      if (isExpired(storedSession.accessTokenExpiresAt)) {
        refreshToken().catch(() => {
          logout()
        })
      }
    }, 30 * 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [logout, refreshToken, user])

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    loginWithMicrosoft,
    logout,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
