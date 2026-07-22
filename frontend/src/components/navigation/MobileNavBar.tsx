import {
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import PeopleIcon from '@mui/icons-material/People'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined'
import type { MouseEvent } from 'react'
import type { User } from '../../contexts/AuthContext'
import type { NavLink } from './navigation'
import { getRoleLabel } from '../../utils/role-label'

interface MobileNavBarProps {
  activePath: string
  anchorEl: HTMLElement | null
  links: NavLink[]
  onLogout: () => void
  onMenuClose: () => void
  onMenuOpen: (event: MouseEvent<HTMLElement>) => void
  onNavigate: (path: string) => void
  canStartTour: boolean
  currentTourTitle: string | null
  onStartTour: () => void
  user: User
}

const isActivePath = (pathname: string, path: string) =>
  pathname === path || (path !== '/dashboard' && pathname.startsWith(path))

export function MobileNavBar({
  activePath,
  anchorEl,
  links,
  onLogout,
  onMenuClose,
  onMenuOpen,
  onNavigate,
  canStartTour,
  currentTourTitle,
  onStartTour,
  user,
}: MobileNavBarProps) {
  const isAdmin = user.role === 'ADMIN'

  return (
    <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
      <IconButton
        onClick={onMenuOpen}
        aria-label="Abrir menu de navegacion"
        sx={{ color: 'brand.white' }}
      >
        <MenuIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onMenuClose}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              minWidth: 260,
              boxShadow: 4,
            },
          },
        }}
      >
        <MenuItem disabled sx={{ opacity: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: 'brand.red',
                color: 'brand.white',
                width: 36,
                height: 36,
                fontWeight: 700,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Stack spacing={0.25}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getRoleLabel(user.role)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.email}
              </Typography>
            </Stack>
          </Stack>
        </MenuItem>
        <Divider />
        {links.map((link) => {
          const isActive = isActivePath(activePath, link.path)

          return (
            <MenuItem
              key={link.path}
              onClick={() => {
                onMenuClose()
                onNavigate(link.path)
              }}
              sx={{
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'brand.red' : 'text.primary',
              }}
            >
              {link.label}
            </MenuItem>
          )
        })}
        {isAdmin ? (
          <Box>
            <Divider />
            <MenuItem
              onClick={() => {
                onMenuClose()
                onNavigate('/admin/users')
              }}
            >
              <ListItemIcon>
                <PeopleIcon fontSize="small" />
              </ListItemIcon>
              Usuarios
            </MenuItem>
            <MenuItem
              onClick={() => {
                onMenuClose()
                onNavigate('/admin')
              }}
            >
              <ListItemIcon>
                <AdminPanelSettingsIcon fontSize="small" />
              </ListItemIcon>
              Admin Panel
            </MenuItem>
          </Box>
        ) : null}
        <Divider />
        {canStartTour ? (
          <MenuItem
            onClick={() => {
              onMenuClose()
              onStartTour()
            }}
          >
            <ListItemIcon>
              <HelpOutlineIcon fontSize="small" />
            </ListItemIcon>
            {currentTourTitle ? `Recorrer: ${currentTourTitle}` : 'Recorrer esta pagina'}
          </MenuItem>
        ) : null}
        <Divider />
        <MenuItem onClick={onLogout} sx={{ color: 'error.main', fontWeight: 600 }}>
          Cerrar sesion
        </MenuItem>
      </Menu>
    </Box>
  )
}
