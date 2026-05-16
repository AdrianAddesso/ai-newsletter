import {
  Box,
  Button,
  Card,
  Container,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../hooks/useNotification'

export function SettingsPage() {
  const { user, refreshToken, logout } = useAuth()
  const { error, success } = useNotification()
  const navigate = useNavigate()
  const theme = useTheme()

  const handleSave = () => {
    success('Cambios guardados correctamente')
  }

  const handleRefreshSession = async () => {
    try {
      await refreshToken()
      success('Sesion renovada correctamente')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo renovar la sesion'
      error(message)
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1500)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <Box
      sx={{
        py: theme.nestle.page.sectionPaddingY,
        px: theme.nestle.page.sectionPaddingX,
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Stack spacing={4}>
          <Typography variant="h2">Configuracion</Typography>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
            <Stack spacing={3}>
              <Typography variant="h5">Perfil Microsoft</Typography>
              <Stack spacing={2}>
                <TextField fullWidth label="Nombre" defaultValue={user?.name} />
                <TextField fullWidth label="Email" defaultValue={user?.email} disabled />
                <TextField fullWidth label="Rol" defaultValue={user?.role} disabled />
              </Stack>
              <Button variant="contained" color="primary" sx={{ alignSelf: 'flex-start' }} onClick={handleSave}>
                Guardar cambios
              </Button>
            </Stack>
          </Card>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h5">Preferencias de notificaciones</Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Alertas de revision</Typography>
                  <Switch defaultChecked />
                </Stack>
                <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Cambios de estado de newsletters</Typography>
                  <Switch defaultChecked />
                </Stack>
              </Stack>
            </Stack>
          </Card>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
            <Stack spacing={3}>
              <Typography variant="h5">Sesion y seguridad</Typography>
              <Typography variant="body2" color="text.secondary">
                La autenticacion se simula con Microsoft SSO y tokens hardcoded.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button variant="outlined" onClick={handleRefreshSession}>
                  Renovar token
                </Button>
                <Button variant="outlined" color="error" onClick={handleLogout}>
                  Cerrar sesion
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}
