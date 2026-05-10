import { Box } from '@mui/material'
import { Paper } from '@mui/material'
import { Typography } from '@mui/material'

import type {
  Swatch,
} from '../utils/constants'

import {
  getContrastColor,
} from '../utils/color'

export function TokenSwatch({
  name,
  value,
  text,
}: Swatch) {
  const textColor =
    text ??
    getContrastColor(value)

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          bgcolor: value,
          color: textColor,
          minHeight: 112,
          p: 2,
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <Typography variant="overline">
          {name}
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <Typography variant="body2">
          {value}
        </Typography>
      </Box>
    </Paper>
  )
}