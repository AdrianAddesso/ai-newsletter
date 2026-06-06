import axios from 'axios'
import type { AppNotification } from '../contexts/NotificationContext'
import {
  NotificationType,
  type NotificationType as NotificationTypeValue,
} from '@shared/enums/notification-type.enum'

const API_BASE = '/notifications'

export type NotificationDto = {
  id: string
  userId: string
  newsletterId: string | null
  type: NotificationTypeValue
  title: string
  message: string
  actionPath: string | null
  isRead: boolean
  createdAt: string
  updatedAt: string
}

const notificationTypeMap: Record<NotificationDto['type'], AppNotification['type']> = {
  [NotificationType.PENDING_REVIEW]: 'pending-review',
  [NotificationType.APPROVED]: 'approved',
  [NotificationType.REJECTED]: 'rejected',
  [NotificationType.REMINDER]: 'reminder',
  [NotificationType.INFO]: 'info',
  [NotificationType.NEW_NEWSLETTER]: 'pending-review',
}

function mapToAppNotification(dto: NotificationDto): AppNotification {
  return {
    id: dto.id,
    type: notificationTypeMap[dto.type],
    title: dto.title,
    message: dto.message,
    timestamp: new Date(dto.createdAt).getTime(),
    isRead: dto.isRead,
    actionPath: dto.actionPath ?? undefined,
  }
}

export async function getNotifications(limit = 20): Promise<AppNotification[]> {
  try {
    const response = await axios.get<NotificationDto[]>(`${API_BASE}?limit=${limit}`)
    return response.data.map(mapToAppNotification)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const response = await axios.get<{ count: number }>(`${API_BASE}/unread-count`)
    return response.data.count
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return 0
  }
}

export async function markAsRead(notificationId: string): Promise<AppNotification | null> {
  try {
    const response = await axios.patch<NotificationDto>(`${API_BASE}/${notificationId}/read`)
    return mapToAppNotification(response.data)
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return null
  }
}

export async function markAllAsRead(): Promise<boolean> {
  try {
    await axios.patch(`${API_BASE}/read-all`)
    return true
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    await axios.delete(`${API_BASE}/${notificationId}`)
    return true
  } catch (error) {
    console.error('Error deleting notification:', error)
    return false
  }
}
