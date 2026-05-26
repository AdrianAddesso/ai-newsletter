import type { User } from '../types/users'

export function exportUsers(users: User[]) {
  const headers = [
    'Nombre',
    'Apellido',
    'Email',
    'Rol',
    'Estado',
  ]

  const rows = users.map(user => [
    user.name,
    user.last_name,
    user.email,
    user.role,
    user.state,
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n')

  const blob = new Blob(
    [csv],
    {
      type:'text/csv;charset=utf-8;',
    },
  )

  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')

  link.href = url
  link.download = 'usuarios.csv'

  link.click()

  URL.revokeObjectURL(url)
}