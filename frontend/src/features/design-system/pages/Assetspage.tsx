import { Box } from '@mui/material'
import { Paper } from '@mui/material'
import { Stack } from '@mui/material'
import { Typography } from '@mui/material'
import { useTheme } from '@mui/material'

import {
  BackendConnectionDemo,
} from '../components/BackendConnectionDemo'

import {
  SectionHeader,
} from '../components/SectionHeader'

export function AssetsPage() {
  const theme = useTheme()

  return (
    <Stack spacing={5}>
      <SectionHeader
        eyebrow="Theme assets"
        title="Logos disponibles para paginas"
        description="El theme registra recursos visuales genericos para fondos de color."
      />

      <BackendConnectionDemo />

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
        <Paper
          elevation={0}
          sx={{
            bgcolor: 'brand.red',
            color: 'brand.white',
            p: { xs: 3, md: 4 },
          }}
        >
          <Stack spacing={2}>
            <Box
              component="img"
              src={theme.appBrand.assets.logos.primary}
              alt="Logo generico"
              sx={{ width: 96 }}
            />

            <Typography variant="h4">
              Marca principal
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}
