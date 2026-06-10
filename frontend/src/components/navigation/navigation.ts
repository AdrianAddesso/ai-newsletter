import type { UserRole } from '../../contexts/AuthContext'

export interface NavLink {
  label: string
  path: string
  roles: UserRole[]
}

export const navLinks: NavLink[] = [
  {
    label: 'Newsletters',
    path: '/dashboard',
    roles: ['ADMIN', 'FUNCTIONAL', 'USER'],
  },
  {
    label: 'Templates',
    path: '/templates',
    roles: ['ADMIN', 'FUNCTIONAL'],
  },
  {
    label: 'Analitica',
    path: '/analytics',
    roles: ['ADMIN', 'FUNCTIONAL'],
  },
  {
    label: 'Revisiones',
    path: '/reviews',
    roles: ['ADMIN', 'FUNCTIONAL'],
  },
]
