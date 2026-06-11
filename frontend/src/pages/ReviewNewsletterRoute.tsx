import { useEffect } from 'react'
import { Alert, Box, CircularProgress } from '@mui/material'
import { useNewsletterEditor } from './newsletter/hooks/useNewsletterEditor'
import { ReviewNewsletterPage } from './newsletter/review/ReviewNewsletterPage'

export function ReviewNewsletterRoute() {
  const editor = useNewsletterEditor()

  const { newsletter, navigate } = editor

  useEffect(() => {
    if (
      newsletter &&
      newsletter.state !== 'IN_REVIEW' &&
      newsletter.state !== 'RESUBMITTED'
    ) {
      alert('Newsletter is no longer available for review')
      navigate('/reviews')
    }
  }, [newsletter, navigate])

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

  if (!editor.newsletter) {
    return <Alert severity="warning">No se encontrÃ³ el newsletter solicitado.</Alert>
  }

  return <ReviewNewsletterPage editor={editor} />
}
