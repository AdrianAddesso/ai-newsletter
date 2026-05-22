import { Stack } from '@mui/material'

type Props = {
  children: React.ReactNode
}

export function NewsletterReviewSidebar({
  children,
}: Props) {
  return (
    <Stack spacing={2}>
      {children}
    </Stack>
  )
}