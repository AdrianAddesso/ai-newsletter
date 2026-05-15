import { Stack } from '@mui/material'
import { Typography } from '@mui/material'

type Props = {
  eyebrow: string
  title: string
  description: string
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: Props) {
  return (
    <Stack
      spacing={1.25}
      sx={{ maxWidth: 760 }}
    >
      <Typography variant="overline">
        {eyebrow}
      </Typography>

      <Typography variant="h2">
        {title}
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
      >
        {description}
      </Typography>
    </Stack>
  )
}