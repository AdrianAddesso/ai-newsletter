import { user_role } from '@prisma/client'

export interface AuthUser {
  id: string
  role: user_role
  area: string
}

export interface PrismaEntityModel {
  findUnique: (args: { where: { id: string } }) => Promise<unknown>
}