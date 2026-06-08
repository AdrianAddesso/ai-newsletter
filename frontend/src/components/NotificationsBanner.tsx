import {
  Box,
  Typography,
  Badge,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  ButtonBase,
  Stack,
  IconButton,
  useTheme,
  type Theme,
} from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications' //pnpm add @mui/icons-material
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAppNotifications, type AppNotification } from '../contexts/NotificationContext'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'

// 1. Lógica de iniciales limpia
const getNotificationIconLabel = (type: string) => {
  switch (type) {
    case 'pending-review': return 'R'
    case 'approved': return 'A'
    case 'rejected': return '!'
    case 'reminder': return '!'
    default: return 'i'
  }
}

// Uso dinámico del Theme de MUI en lugar de colores hardcodeados
const getNotificationColor = (type: string, theme: Theme) => {
  switch (type) {
    case 'pending-review':
      return theme.palette.warning.main
    case 'approved':
      return theme.palette.success.main
    case 'rejected':
      return theme.palette.error.main
    case 'reminder':
      return theme.palette.info.main
    default:
      return theme.palette.primary.main
  }
}

const initialCurrentTime = Date.now()

const formatTime = (timestamp: number, now: number): string => {
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`
  if (hours < 24) return `Hace ${hours}h`
  if (days < 7) return `Hace ${days}d`
  return new Date(timestamp).toLocaleDateString('es-ES')
}

export function NotificationsBanner() {
  const theme = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(initialCurrentTime)
  const panelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } =
    useAppNotifications()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 60 * 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification.id)
    if (notification.actionPath) {
      navigate(notification.actionPath)
      setIsOpen(false)
    }
  }

  return (
    <Box ref={panelRef} sx={{ position: 'relative' }}>
      {/* Banner de botón principal */}
      <ButtonBase
        onClick={() => setIsOpen((prev) => !prev)}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          borderRadius: 1.5,
          bgcolor: 'background.paper',
          px: 2,
          py: 1.5,
          color: 'text.primary',
          transition: 'all 0.2s ease',
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Badge
            badgeContent={unreadCount}
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontWeight: 700,
                fontSize: 11,
              },
            }}
          >
            {unreadCount > 0 ? (
              <NotificationsIcon sx={{ fontSize: 20, color: theme.palette.error.main }} />
            ) : (
              <NotificationsNoneIcon />
            )}
          </Badge>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Notificaciones
          </Typography>
        </Box>
      </ButtonBase>

      {/* Panel Desplegable */}
      <Collapse in={isOpen}>
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 'calc(100% + 8px)',
            zIndex: theme.zIndex.tooltip,
            borderRadius: 1.5,
            overflow: 'hidden',
            maxHeight: 400,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Cabecera del Panel */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {notifications.length} notificaciones
            </Typography>
            {unreadCount > 0 && (
              <ButtonBase
                onClick={markAllAsRead}
                sx={{
                  fontSize: 12,
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Marcar todo como leído
              </ButtonBase>
            )}
          </Box>

          {/* Lista de Notificaciones */}
          {notifications.length > 0 ? (
            <List
              disablePadding
              sx={{
                overflowY: 'auto',
                flex: 1,
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'divider',
                  borderRadius: 3,
                },
              }}
            >
              {notifications.map((notification, index) => {
                const iconLabel = getNotificationIconLabel(notification.type)
                const notifColor = getNotificationColor(notification.type, theme)

                return (
                  <ListItem
                    key={notification.id}
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderBottom: index < notifications.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      alignItems: 'flex-start',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {!notification.isRead && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          bgcolor: theme.palette.primary.main,
                        }}
                      />
                    )}

                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: `${notifColor}15`,
                          border: `1px solid ${notifColor}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: notifColor, fontWeight: 800 }}>
                          {iconLabel}
                        </Typography>
                      </Box>
                    </ListItemIcon>

                    <ListItemText
                      primary={notification.title}
                      secondary={
                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {notification.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.disabled', fontWeight: 500 }}
                          >
                            {formatTime(notification.timestamp, currentTime)}
                          </Typography>
                        </Stack>
                      }
                      slotProps={{
                        primary: {
                          variant: 'body2',
                          sx: {
                            fontWeight: notification.isRead ? 400 : 600,
                            color: 'text.primary',
                          },
                        },
                        // CORRECCIÓN AQUÍ: Esto evita el error de validación de DOM
                        secondary: {
                          component: 'div',
                        },
                      }}
                    />

                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNotification(notification.id)
                      }}
                      sx={{
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        '.MuiListItem-root:hover &': {
                          opacity: 0.6,
                        },
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      <HighlightOffIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                )
              })}
            </List>
          ) : (
            <Box
              sx={{
                py: 5,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'text.secondary',
              }}
            >
              <Typography variant="body2">No hay notificaciones pendientes</Typography>
            </Box>
          )}
        </Paper>
      </Collapse>
    </Box>
  )
}

export default NotificationsBanner