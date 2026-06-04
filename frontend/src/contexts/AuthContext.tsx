/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react'

import { type AuthSessionValue, useAuthSession } from '../hooks/useAuthSession'
import { type AuthUser } from '../api/auth'

export type UserRole = AuthUser['role']
export type User = AuthUser

export type AuthContextType = AuthSessionValue

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const authSession = useAuthSession()

  return <AuthContext.Provider value={authSession}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
