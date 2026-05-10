import { Alert } from '@mui/material'
import { Box } from '@mui/material'
import { Button } from '@mui/material'
import { Card } from '@mui/material'
import { CardContent } from '@mui/material'
import { Chip } from '@mui/material'
import { Divider } from '@mui/material'
import { Paper } from '@mui/material'
import { Stack } from '@mui/material'
import { Switch } from '@mui/material'
import { TextField } from '@mui/material'
import { Typography } from '@mui/material'

import {
  SectionHeader,
} from '../components/SectionHeader'

export function ComponentsPage() {
  return (
    <Stack spacing={6}>
      <SectionHeader
        eyebrow="Components"
        title="Componentes del sistema"
        description="Preview de componentes reutilizables y overrides del theme."
      />

      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          p: 3,
        }}
      >
        <Stack spacing={3}>
          <Typography variant="h4">
            Botones
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            sx= {{flexWrap: 'wrap', alignItems: 'center'}}
          >
            <Button variant="contained">
              Primario
            </Button>

            <Button variant="outlined">
              Outline
            </Button>

            <Button variant="text">
              Text
            </Button>

            <Button
              variant="contained"
              color="secondary"
            >
              Secondary
            </Button>

            <Button disabled>
              Disabled
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          p: 3,
        }}
      >
        <Stack spacing={3}>
          <Typography variant="h4">
            Inputs
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Título"
              placeholder="Ingresar texto"
              fullWidth
            />

            <TextField
              label="Descripción"
              multiline
              minRows={4}
              fullWidth
            />
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          p: 3,
        }}
      >
        <Stack spacing={3}>
          <Typography variant="h4">
            Alerts
          </Typography>

          <Stack spacing={2}>
            <Alert severity="success">
              Operación exitosa
            </Alert>

            <Alert severity="warning">
              Atención requerida
            </Alert>

            <Alert severity="error">
              Error de sistema
            </Alert>

            <Alert severity="info">
              Información adicional
            </Alert>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          p: 3,
        }}
      >
        <Stack spacing={3}>
          <Typography variant="h4">
            Chips y toggles
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            sx={{alignItems: 'center',
            flexWrap: 'wrap'}}
          >
            <Chip
              label="Publicado"
              color="success"
            />

            <Chip
              label="Pendiente"
              color="warning"
            />

            <Chip
              label="Error"
              color="error"
            />

            <Switch defaultChecked />

            <Switch />
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          p: 3,
        }}
      >
        <Stack spacing={3}>
          <Typography variant="h4">
            Cards
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h5">
                    Newsletter semanal
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Resumen corporativo interno
                  </Typography>

                  <Divider />

                  <Button variant="contained">
                    Ver más
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h5">
                    Campaña RRHH
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Comunicación interna de beneficios
                  </Typography>

                  <Divider />

                  <Button variant="outlined">
                    Editar
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  )
}