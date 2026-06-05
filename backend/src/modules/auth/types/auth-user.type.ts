import { user_role } from '@prisma/client'

export interface AuthUser {
  id: string
  role: user_role
  area: string
}