import { Alert, Stack } from '@mui/material'
import type { Notification } from '../hooks/useNotification'

interface NotificationManagerProps {
  notifications: Notification[]
  onClose: (id: string) => void
}

export function NotificationManager({ notifications, onClose }: NotificationManagerProps) {
  return (
    <Stack
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        maxWidth: 400,
        width: '100%',
      }}
      spacing={1}
    >
      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          onClose={() => onClose(notification.id)}
          severity={notification.type === 'info' ? 'info' : notification.type}
          variant="filled"
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {notification.message}
        </Alert>
      ))}
    </Stack>
  )
}
