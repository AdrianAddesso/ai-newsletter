import type { notification_type } from '@prisma/client'

export type CreateNotificationDto = {
  userId: string
  title: string
  message: string
  type: notification_type
  actionPath?: string
  newsletterId?: string
}

export type NotificationDto = {
  id: string
  userId: string
  newsletterId: string | null
  type: notification_type
  title: string
  message: string
  actionPath: string | null
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

export type UpdateNotificationDto = {
  isRead?: boolean
  actionPath?: string
}
