import type { PropsWithChildren } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import { AlertProvider } from '../hooks/useNotification'

export function AppProviders({
  children,
}: PropsWithChildren) {
  return (
    <AuthProvider>
      <AlertProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </AlertProvider>
    </AuthProvider>
  )
}