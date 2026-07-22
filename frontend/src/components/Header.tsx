import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router'
import appLogo from '../assets/placeholders/PlaceholderIcon.svg'

type NavLinkItem = {
  href: string
  label: string
}

const navLinks: NavLinkItem[] = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/dashboard/newsletters', label: 'Mis newsletters' },
  { href: '/dashboard/templates', label: 'Templates' },
  { href: '/dashboard/aprobaciones', label: 'Aprobaciones' },
]

export function Header() {
  const location = useLocation()

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0.5}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        px: '125px',
      }}
    >
      <Toolbar
        sx={{
          minHeight: 72,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src={appLogo}
            alt="App logo"
            sx={{
              width: 56,
              height: 'auto',
              display: 'block',
            }}
          />

          <Typography variant="subtitle1">AI Newsletter Studio</Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          {navLinks.map((link) => {
            const isActive =
              location.pathname === link.href ||
              (link.href !== '/dashboard' &&
                location.pathname.startsWith(link.href))

            return (
              <Button
                key={link.href}
                component={RouterLink}
                to={link.href}
                color={isActive ? 'primary' : 'inherit'}
                sx={{
                  borderBottom: isActive
                    ? '2px solid'
                    : '2px solid transparent',
                  borderRadius: 0,
                  px: 1,
                }}
              >
                {link.label}
              </Button>
            )
          })}
        </Box>

        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: 'grey.100',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
            marginRight: 5,
          }}
        >
          JD
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
