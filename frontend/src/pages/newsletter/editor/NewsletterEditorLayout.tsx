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
        data-onboarding="newsletter-preview"
        sx={{
          order: { xs: 2, lg: 1 },
          p: 3,
          borderRight: {
            lg: '1px solid',
          },
          borderTop: {
            xs: '1px solid',
            lg: 'none',
          },
          borderColor: 'divider',
          minWidth: 0,
          minHeight: { xs: 'auto', lg: 'calc(100vh - 48px)' },
          maxHeight: { xs: 'none', lg: 'calc(100vh - 48px)' },
          overflowY: { xs: 'visible', lg: 'auto' },
        }}
      > <Box sx={{ width: 'fit-content', mx: 'auto' }}>
          {left}
      </Box>
      </Box>

      <Box
        data-onboarding="newsletter-editor"
        sx={{
          p: 3,
          minWidth: 0,
          order: { xs: 1, lg: 2 },
        }}
      >
        {right}
      </Box>
    </Box>
  )
}
