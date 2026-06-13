import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material'

import { useNewsletterEditor } from './newsletter/hooks/useNewsletterEditor'
import { DraftNewsletterPage } from './newsletter/draft/DraftNewsletterPage'

export default function EditNewsletterPage() {
  const editor = useNewsletterEditor()

  if (editor.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (editor.error) {
    return <Alert severity="error">{editor.error}</Alert>
  }

  if (!editor.newsletter) return null
  const newsletter = editor.newsletter

  if (editor.isApproved) {
    return (
      <Alert
        severity="info"
        action={
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              size="small"
              onClick={() =>
                editor.navigate(`/exportarNewsletter/${newsletter.id}`)
              }
            >
              Exportar
            </Button>

            <Button
              color="inherit"
              size="small"
              onClick={() => editor.navigate('/dashboard')}
            >
              Ir al inicio
            </Button>
          </Stack>
        }
      >
        Este newsletter ya fue aprobado.
      </Alert>
    )
  }

  return <DraftNewsletterPage editor={editor} />
}
