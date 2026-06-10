import axios from 'axios'

import { apiBaseUrl } from '../config/api'

export type UserRole = 'ADMIN' | 'FUNCTIONAL' | 'USER'

export type UserState = 'ACTIVE' | 'INACTIVE' | 'REMOVED'

export interface AuthUser {
  id: string
  email: string
  name: string
  lastName?: string
  role: UserRole
  areaId?: string
  state: UserState
}

export function getGoogleLoginUrl(): string {
  return `${apiBaseUrl}/auth/google/start`
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await axios.get<AuthUser>('/auth/me')

  return response.data
}

export async function logoutSession(): Promise<void> {
  await axios.post('/auth/logout')
}

export async function refreshSession(): Promise<void> {
  await axios.post('/auth/refresh')
}
