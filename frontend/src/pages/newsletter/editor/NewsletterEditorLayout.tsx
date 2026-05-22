import { Box } from '@mui/material'

type Props = {
  left: React.ReactNode
  right: React.ReactNode
}

export function NewsletterEditorLayout({
  left,
  right,
}: Props) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          lg: 'minmax(0,1fr) minmax(380px,0.72fr)',
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          borderRight: {
            lg: '1px solid',
          },
          borderColor: 'divider',
        }}
      >
        {left}
      </Box>

      <Box sx={{ p: 3 }}>
        {right}
      </Box>
    </Box>
  )
}