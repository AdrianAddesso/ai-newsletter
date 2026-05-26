export type UserRole =
  | 'ADMIN'
  | 'FUNCTIONAL'
  | 'USER'

export type UserState =
  | 'ACTIVE'
  | 'INACTIVE'

export type User = {
  id: string
  name: string
  last_name: string
  email: string
  role: UserRole
  state: UserState
  area_id: string | null
  created_at: string
}

export type CreateUserPayload = {
  name: string
  last_name: string
  email: string
  role: UserRole
  state: UserState
  area_id?: string
}

export type UpdateUserPayload =
  Partial<CreateUserPayload>