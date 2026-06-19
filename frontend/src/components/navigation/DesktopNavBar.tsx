import {
  Avatar,
  Box,
  Button,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import DownloadIcon from '@mui/icons-material/Download'
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined'
import type { MouseEvent } from 'react'
import type { User } from '../../contexts/AuthContext'
import type { NavLink } from './navigation'
import { getRoleLabel } from '../../utils/role-label'

interface DesktopNavBarProps {
  activePath: string
  anchorEl: HTMLElement | null
  links: NavLink[]
  onLogout: () => void
  onMenuClose: () => void
  onMenuOpen: (event: MouseEvent<HTMLElement>) => void
  onNavigate: (path: string) => void
  canStartTour: boolean
  currentTourTitle: string | null
  guideUrl: string
  onStartTour: () => void
  user: User
}

const isActivePath = (pathname: string, path: string) =>
  pathname === path || (path !== '/dashboard' && pathname.startsWith(path))

export function DesktopNavBar({
  activePath,
  anchorEl,
  links,
  onLogout,
  onMenuClose,
  onMenuOpen,
  onNavigate,
  canStartTour,
  currentTourTitle,
  guideUrl,
  onStartTour,
  user,
}: DesktopNavBarProps) {
  const isAdmin = user.role === 'ADMIN'

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{
          flex: 1,
          justifyContent: 'center',
          display: { xs: 'none', md: 'flex' },
        }}
      >
        {links.map((link) => {
          const isActive = isActivePath(activePath, link.path)

          return (
            <Button
              key={link.path}
              onClick={() => onNavigate(link.path)}
              sx={{
                color: isActive ? 'brand.darkOak' : 'brand.white',
                bgcolor: isActive ? 'brand.white' : 'transparent',
                borderRadius: 1,
                px: 2,
                py: 1,
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: isActive ? 'brand.white' : 'rgba(255,255,255,0.1)',
                },
              }}
            >
              {link.label}
            </Button>
          )
        })}
      </Stack>

      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: 'center',
          minWidth: 200,
          display: { xs: 'none', md: 'flex' },
        }}
      >
        <Stack direction="column" spacing={0.5}>
          <Typography
            variant="body2"
            sx={{
              color: 'brand.white',
              fontWeight: 600,
              textAlign: 'right',
            }}
          >
            {user.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              textAlign: 'right',
            }}
          >
            {getRoleLabel(user.role)}
          </Typography>
        </Stack>

        <Avatar
          onClick={onMenuOpen}
          sx={{
            cursor: 'pointer',
            bgcolor: 'brand.white',
            color: 'brand.red',
            fontWeight: 700,
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'scale(1.1)',
            },
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </Avatar>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={onMenuClose}
          slotProps={{
            paper: {
              sx: {
                mt: 1.5,
                boxShadow: 3,
              },
            },
          }}
        >
          <MenuItem disabled>
            <Stack spacing={0.5}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, alignSelf: 'center' }}
              >
                {user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.email}
              </Typography>
            </Stack>
          </MenuItem>
          <Divider />
          {isAdmin ? (
            <Box>
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
              <Divider />
            </Box>
          ) : null}
          <MenuItem component="a" href={guideUrl} download onClick={onMenuClose}>
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            Descargar guía de usuario
          </MenuItem>
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
              {currentTourTitle ? `Recorrer: ${currentTourTitle}` : 'Recorrer esta página'}
            </MenuItem>
          ) : null}
          <Divider />
          <MenuItem
            onClick={onLogout}
            sx={{ color: 'error.main', justifyContent: 'center' }}
          >
            Cerrar sesión
          </MenuItem>
        </Menu>
      </Stack>
    </>
  )
}
