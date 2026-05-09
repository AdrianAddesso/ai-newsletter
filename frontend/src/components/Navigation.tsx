import {
  AppBar,
  Box,
  Button,
  Container,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useTheme,
  Avatar,
  Divider,
} from '@mui/material'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../contexts/AuthContext'
import { getRoleLabel } from '../utils/role-label'

interface NavLink {
  label: string
  path: string
  roles: UserRole[]
}

const navLinks: NavLink[] = [
  { label: 'Dashboard', path: '/dashboard', roles: ['ADMIN', 'FUNCTIONAL', 'USER'] },
  { label: 'Templates', path: '/templates', roles: ['ADMIN', 'FUNCTIONAL'] },
  { label: 'Analitica', path: '/analytics', roles: ['ADMIN', 'FUNCTIONAL'] },
  { label: 'Revisiones', path: '/reviews', roles: ['ADMIN', 'FUNCTIONAL'] },
  { label: 'Usuarios', path: '/users', roles: ['ADMIN'] },
  //{ label: 'Configuracion', path: '/settings', roles: ['ADMIN', 'FUNCTIONAL'] },
]

export function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  if (!user) {
    return null
  }

  const visibleLinks = navLinks.filter((link) => link.roles.includes(user.role))
  const isActive = (path: string) => location.pathname === path

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleMenuClose()
    logout()
    navigate('/login')
  }

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'brand.red', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Container maxWidth="lg" disableGutters>
        <Toolbar
          sx={{
            px: theme.nestle.page.sectionPaddingX,
            py: 2,
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
            onClick={() => navigate('/dashboard')}
          >
            <Box
              component="img"
              src={theme.nestle.assets.logos.nestWhite}
              alt="Nestle"
              sx={{ width: 80, height: 'auto' }}
            />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: 'brand.white',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                }}
              >
                NEWSLETTER
              </Typography>
            </Box>
          </Box>

          {/* Navigation Links */}
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
            {visibleLinks.map((link) => (
              <Button
                key={link.path}
                onClick={() => navigate(link.path)}
                sx={{
                  color: isActive(link.path) ? 'brand.darkOak' : 'brand.white',
                  bgcolor: isActive(link.path) ? 'brand.white' : 'transparent',
                  borderRadius: 1,
                  px: 2,
                  py: 1,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isActive(link.path) ? 'brand.white' : 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                {link.label}
              </Button>
            ))}
          </Stack>

          {/* User Profile */}
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: 'center', minWidth: 200 }}
          >
            <Stack direction="column" spacing={0.5} sx={{ display: { xs: 'none', sm: 'flex' } }}>
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
              onClick={handleMenuOpen}
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
              onClose={handleMenuClose}
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
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                </Stack>
              </MenuItem>
              <Divider />
             {/*<MenuItem onClick={() => { handleMenuClose(); navigate('/settings') }}>
                Configuracion
              </MenuItem>*/}
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                Cerrar sesión
              </MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
