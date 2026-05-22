import {
  Stack,
  Typography,
} from '@mui/material'

type Props = {
  title: string
  subtitle?: string
}

export function NewsletterHeader({
  title,
  subtitle,
}: Props) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="h4">
        {title}
      </Typography>

      {subtitle && (
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {subtitle}
        </Typography>
      )}
    </Stack>
  )
}