import { AppBar, Box, Container, Toolbar, Typography, useTheme } from '@mui/material'
import { useState, type MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { DesktopNavBar } from './navigation/DesktopNavBar'
import { MobileNavBar } from './navigation/MobileNavBar'
import { navLinks } from './navigation/navigation'
import { useOnboarding } from '../onboarding/OnboardingProvider'

export function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const theme = useTheme()
  const { canStartCurrentTour, currentTourTitle, startCurrentTour } = useOnboarding()
  const [desktopMenuAnchorEl, setDesktopMenuAnchorEl] = useState<HTMLElement | null>(null)
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<HTMLElement | null>(null)

  if (!user) {
    return null
  }

  const visibleLinks = navLinks.filter((link) => link.roles.includes(user.role))

  const handleNavigate = (path: string) => {
    navigate(path)
  }

  const handleDesktopMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setDesktopMenuAnchorEl(event.currentTarget)
  }

  const handleDesktopMenuClose = () => {
    setDesktopMenuAnchorEl(null)
  }

  const handleMobileMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget)
  }

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null)
  }

  const handleLogout = () => {
    handleDesktopMenuClose()
    handleMobileMenuClose()
    logout()
    navigate('/login')
  }

  return (
    <AppBar
      data-onboarding="navigation"
      position="static"
      elevation={0}
      sx={{
        bgcolor: 'brand.red',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Toolbar
          sx={{
            px: theme.appBrand.page.sectionPaddingX,
            py: 2,
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              minWidth: 0,
            }}
            onClick={() => handleNavigate('/dashboard')}
          >
            <Box
              component="img"
              src={theme.appBrand.assets.logos.mark}
              alt="App logo"
              sx={{ width: 44, height: 'auto', flexShrink: 0 }}
            />
            <Typography
              variant="h6"
              sx={{
                color: 'brand.white',
                fontWeight: 700,
                fontSize: '0.875rem',
                display: { xs: 'none', md: 'block' },
              }}
            >
              NEWSLETTER AI
            </Typography>
          </Box>

          <DesktopNavBar
            activePath={location.pathname}
            anchorEl={desktopMenuAnchorEl}
            links={visibleLinks}
            onLogout={handleLogout}
            onMenuClose={handleDesktopMenuClose}
            onMenuOpen={handleDesktopMenuOpen}
            onNavigate={handleNavigate}
            canStartTour={canStartCurrentTour}
            currentTourTitle={currentTourTitle}
            onStartTour={startCurrentTour}
            user={user}
          />

          <MobileNavBar
            activePath={location.pathname}
            anchorEl={mobileMenuAnchorEl}
            links={visibleLinks}
            onLogout={handleLogout}
            onMenuClose={handleMobileMenuClose}
            onMenuOpen={handleMobileMenuOpen}
            onNavigate={handleNavigate}
            canStartTour={canStartCurrentTour}
            currentTourTitle={currentTourTitle}
            onStartTour={startCurrentTour}
            user={user}
          />
        </Toolbar>
      </Container>
    </AppBar>
  )
}
