import { Box } from '@mui/material'

type Props = {
  html: string
}

export function NewsletterHtmlViewer({
  html,
}: Props) {
  return (
    <Box
      component="iframe"
      title="Newsletter"
      srcDoc={html}
      sx={{
        width: '100%',
        height: 'calc(100vh - 220px)',
        minHeight: 520,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    />
  )
}