import {
  useCallback,
  useState,
} from 'react'

import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from '../../api/users'

import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
} from '../types/users'

export function useUsers() {
  const [users,setUsers] =
    useState<User[]>([])

  const [loading,setLoading] =
    useState(true)

  const [error,setError] =
    useState('')

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)

      const data =
        await listUsers()

      setUsers(data)
    } catch {
      setError(
        'Error cargando usuarios',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useState(() => {
    void loadUsers()
  })

  const handleCreateUser = async (
    payload: CreateUserPayload,
  ) => {
    const created =
      await createUser(payload)

    setUsers(prev => [
      created,
      ...prev,
    ])
  }

  const handleUpdateUser = async (
    id: string,
    payload: UpdateUserPayload,
  ) => {
    const updated =
      await updateUser(id,payload)

    setUsers(prev =>
      prev.map(user =>
        user.id === id
          ? updated
          : user,
      ),
    )
  }

  const handleDeleteUser = async (
    id: string,
  ) => {
    await deleteUser(id)

    setUsers(prev =>
      prev.filter(user =>
        user.id !== id,
      ),
    )
  }

  return {
    users,
    loading,
    error,
    reloadUsers:loadUsers,
    createUser:handleCreateUser,
    updateUser:handleUpdateUser,
    deleteUser:handleDeleteUser,
  }
}