/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { useAuth, type UserRole } from './AuthContext'

export type NotificationType = 'pending-review' | 'approved' | 'rejected' | 'reminder' | 'info'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: number
  isRead: boolean
  actionPath?: string
  icon?: ReactNode
}

type NewNotification = Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>
type NotificationsByUser = Record<string, AppNotification[]>

interface NotificationContextType {
  notifications: AppNotification[]
  unreadCount: number
  addNotification: (notification: NewNotification) => string
  addNotificationForUser: (userId: string, notification: NewNotification) => string
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

const STORAGE_PREFIX = 'nestle-ai-newsletter:notifications'
const getStorageKey = (userId: string) => `${STORAGE_PREFIX}:${userId}`

const readStoredNotifications = (userId: string): AppNotification[] | null => {
  const storedNotifications = localStorage.getItem(getStorageKey(userId))

  if (!storedNotifications) {
    return null
  }

  try {
    const parsedNotifications = JSON.parse(storedNotifications) as AppNotification[]
    return Array.isArray(parsedNotifications) ? parsedNotifications : null
  } catch {
    return null
  }
}

const getInitialNotificationsForUser = (userId: string) =>
  readStoredNotifications(userId) ?? []

const persistNotifications = (userId: string, notifications: AppNotification[]) => {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(notifications))
}

const createRuntimeNotification = (notification: NewNotification): AppNotification => ({
  ...notification,
  id: `${Date.now()}-${Math.random()}`,
  timestamp: Date.now(),
  isRead: false,
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notificationsByUser, setNotificationsByUser] = useState<NotificationsByUser>({})

  const notifications = user
    ? notificationsByUser[user.id] ?? getInitialNotificationsForUser(user.id)
    : []
  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  const updateUserNotifications = useCallback(
    (
      userId: string,
      updater: (notifications: AppNotification[]) => AppNotification[],
    ) => {
      setNotificationsByUser((prev) => {
        const currentNotifications =
          prev[userId] ?? getInitialNotificationsForUser(userId)
        const nextNotifications = updater(
          currentNotifications.map((notification) => ({ ...notification })),
        )

        persistNotifications(userId, nextNotifications)

        return {
          ...prev,
          [userId]: nextNotifications,
        }
      })
    },
    [],
  )

  const addNotification = useCallback(
    (notification: NewNotification) => {
      if (!user) {
        return ''
      }

      const newNotification = createRuntimeNotification(notification)

      updateUserNotifications(user.id, (prev) => [newNotification, ...prev])

      return newNotification.id
    },
    [updateUserNotifications, user],
  )

  const addNotificationForUser = useCallback(
    (userId: string, notification: NewNotification) => {
      const newNotification = createRuntimeNotification(notification)

      updateUserNotifications(userId, (prev) => [
        newNotification,
        ...prev,
      ])

      return newNotification.id
    },
    [updateUserNotifications],
  )

  const markAsRead = useCallback(
    (id: string) => {
      if (!user) {
        return
      }

      updateUserNotifications(user.id, (prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification,
        ),
      )
    },
    [updateUserNotifications, user],
  )

  const markAllAsRead = useCallback(() => {
    if (!user) {
      return
    }

    updateUserNotifications(user.id, (prev) =>
      prev.map((notification) => ({ ...notification, isRead: true })),
    )
  }, [updateUserNotifications, user])

  const removeNotification = useCallback(
    (id: string) => {
      if (!user) {
        return
      }

      updateUserNotifications(user.id, (prev) =>
        prev.filter((notification) => notification.id !== id),
      )
    },
    [updateUserNotifications, user],
  )

  const clearAll = useCallback(() => {
    if (!user) {
      return
    }

    updateUserNotifications(user.id, () => [])
  }, [updateUserNotifications, user])

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    addNotificationForUser,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useAppNotifications() {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error('useAppNotifications must be used within NotificationProvider')
  }

  return context
}
