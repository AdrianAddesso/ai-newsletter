import axios from 'axios'

import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
} from '../users/types/users'

export async function listUsers(): Promise<User[]> {
  const response =
    await axios.get<User[]>('/users')

  return response.data
}

export async function createUser(
  payload: CreateUserPayload,
): Promise<User> {
  const response =
    await axios.post<User>(
      '/users',
      payload,
    )

  return response.data
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<User> {
  const response =
    await axios.patch<User>(
      `/users/${id}`,
      payload,
    )

  return response.data
}

export async function deleteUser(
  id: string,
): Promise<void> {
  await axios.delete(`/users/${id}`)
}