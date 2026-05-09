// Devuelve el label legible para un rol de usuario
import type { UserRole } from '../contexts/AuthContext'

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return 'Administrador'
    case 'FUNCTIONAL':
      return 'Funcional'
    case 'USER':
      return 'Usuario normal'
    default:
      return role
  }
}