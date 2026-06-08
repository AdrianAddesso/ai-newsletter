import type { NotificationType } from '@shared/enums/notification-type.enum'

export type CreateNotificationDto = {
  userId: string
  title: string
  message: string
  type: NotificationType
  actionPath?: string
  newsletterId?: string
}

export type NotificationDto = {
  id: string
  userId: string
  newsletterId: string | null
  type: NotificationType
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
