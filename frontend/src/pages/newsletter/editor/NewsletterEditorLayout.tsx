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
        alignItems: 'start',
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
          minWidth: 0,
          minHeight: 'calc(100vh - 48px)',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
        }}
      > <Box sx={{ width: 'fit-content', mx: 'auto' }}>
          {left}
      </Box>
      </Box>

      <Box
        sx={{
          p: 3,
          minWidth: 0,
        }}
      >
        {right}
      </Box>
    </Box>
  )
}
