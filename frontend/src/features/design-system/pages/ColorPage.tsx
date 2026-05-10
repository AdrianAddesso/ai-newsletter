import { Stack } from '@mui/material'
import { Typography } from '@mui/material'
import { useMemo } from 'react'
import { useTheme } from '@mui/material'

import {
  SectionHeader,
} from '../components/SectionHeader'

import {
  SwatchGrid,
} from '../components/SwatchGrid'

import type {
  Swatch,
} from '../utils/constants'

export function ColorsPage() {
  const theme = useTheme()

  const primarySwatches =
    useMemo<Swatch[]>(
      () => [
        {
          name: 'red',
          value:
            theme.palette.brand.red,
        },
        {
          name: 'darkOak',
          value:
            theme.palette.brand.darkOak,
        },
      ],
      [theme],
    )

  return (
    <Stack spacing={6}>
      <SectionHeader
        eyebrow="Palette"
        title="Colores definidos"
        description="Tokens de color Nestlé"
      />

      <Stack spacing={2}>
        <Typography variant="h3">
          Primarios
        </Typography>

        <SwatchGrid
          swatches={primarySwatches}
        />
      </Stack>
    </Stack>
  )
}