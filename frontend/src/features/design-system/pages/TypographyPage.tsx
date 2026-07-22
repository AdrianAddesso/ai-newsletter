import { Paper } from '@mui/material'
import { Stack } from '@mui/material'
import { Typography } from '@mui/material'
import { useTheme } from '@mui/material'

import {
  SectionHeader,
} from '../components/SectionHeader'

import {
  sampleText,
} from '../utils/constants'

export function TypographyPage() {
  const theme = useTheme()

  return (
    <Stack spacing={6}>
      <SectionHeader
        eyebrow="Typography"
        title="Tipografia"
        description="Tipografia base del sistema"
      />

      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          p: 3,
        }}
      >
        <Typography
          sx={{
            fontFamily: `"${theme.appBrand.fonts.title}"`,
            fontSize: '2rem',
          }}
        >
          {sampleText}
        </Typography>
      </Paper>
    </Stack>
  )
}
