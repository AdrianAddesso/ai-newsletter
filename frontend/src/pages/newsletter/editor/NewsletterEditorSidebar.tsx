import { Stack } from '@mui/material'

type Props = {
  children: React.ReactNode
}

export function NewsletterEditorSidebar({
  children,
}: Props) {
  return (
    <Stack
      spacing={2}
      sx={{
        position: 'sticky',
        top: 24,
        alignSelf: 'start',
        width: '100%',
        minHeight: 'calc(100vh - 48px)',
      }}
    >
      {children}
    </Stack>
  )
}
