/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth, } from './AuthContext'
import {
  getNotifications,
  markAsRead as markAsReadApi,
  markAllAsRead as markAllAsReadApi,
  deleteNotification as deleteNotificationApi,
} from '../api/notifications'

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

interface NotificationContextType {
  notifications: AppNotification[]
  unreadCount: number
  addNotification: (notification: NewNotification) => string
  addNotificationForUser: (userId: string, notification: NewNotification) => string
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  isLoading: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

const createRuntimeNotification = (notification: NewNotification): AppNotification => ({
  ...notification,
  id: `${Date.now()}-${Math.random()}`,
  timestamp: Date.now(),
  isRead: false,
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  // Load notifications from API when user changes
  useEffect(() => {
    if (!user) {
      return
    }

    const loadNotifications = async () => {
      setIsLoading(true)
      try {
        const fetchedNotifications = await getNotifications(20)
        setNotifications(fetchedNotifications)
      } catch (error) {
        console.error('Error loading notifications:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)

    return () => clearInterval(interval)
  }, [user])

  const addNotification = useCallback(
    (notification: NewNotification) => {
      if (!user) {
        return ''
      }

      const newNotification = createRuntimeNotification(notification)
      setNotifications((prev) => [newNotification, ...prev])

      return newNotification.id
    },
    [user],
  )

  const addNotificationForUser = useCallback((userId: string, notification: NewNotification) => {
    const newNotification = createRuntimeNotification(notification)
    setNotifications((prev) => [newNotification, ...prev])

    return newNotification.id
  }, [])

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification,
        ),
      )

      // Call API
      try {
        await markAsReadApi(id)
      } catch (error) {
        console.error('Error marking notification as read:', error)
        // Revert optimistic update on error
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id ? { ...notification, isRead: false } : notification,
          ),
        )
      }
    },
    [],
  )

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))

    try {
      await markAllAsReadApi()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      // Reload notifications on error
      if (user) {
        const fetchedNotifications = await getNotifications(20)
        setNotifications(fetchedNotifications)
      }
    }
  }, [user])

  const removeNotification = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) => prev.filter((notification) => notification.id !== id))

      try {
        await deleteNotificationApi(id)
      } catch (error) {
        console.error('Error deleting notification:', error)
        // Reload notifications on error
        if (user) {
          const fetchedNotifications = await getNotifications(20)
          setNotifications(fetchedNotifications)
        }
      }
    },
    [user],
  )

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    addNotificationForUser,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    isLoading,
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
