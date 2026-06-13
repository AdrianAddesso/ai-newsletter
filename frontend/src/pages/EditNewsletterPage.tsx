import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material'
import { useEffect } from 'react'

import { useNewsletterEditor } from './newsletter/hooks/useNewsletterEditor'
import { DraftNewsletterPage } from './newsletter/draft/DraftNewsletterPage'

export default function EditNewsletterPage() {
  const editor = useNewsletterEditor()

  useEffect(() => {
    if (editor.isLoading || !editor.newsletter) {
      return
    }

    if (editor.currentUserRole === 'FUNCTIONAL') {
      editor.navigate('/dashboard', { replace: true })
    }
  }, [
    editor.currentUserRole,
    editor.isLoading,
    editor.navigate,
    editor.newsletter,
  ])

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

  if (editor.currentUserRole === 'FUNCTIONAL') {
    return (
      <Alert severity="warning">
        No tienes permisos para editar newsletters.
      </Alert>
    )
  }

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
                editor.navigate(`/newsletters/export/${newsletter.id}`)
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
