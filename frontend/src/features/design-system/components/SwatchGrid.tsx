import { Box } from '@mui/material'

import type {
  Swatch,
} from '../utils/constants'

import {
  TokenSwatch,
} from './TokenSwatch'

type Props = {
  swatches: Swatch[]
}

export function SwatchGrid({
  swatches,
}: Props) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 1fr))',
        },
        gap: 2,
      }}
    >
      {swatches.map((swatch) => (
        <TokenSwatch
          key={`${swatch.name}-${swatch.value}`}
          {...swatch}
        />
      ))}
    </Box>
  )
}