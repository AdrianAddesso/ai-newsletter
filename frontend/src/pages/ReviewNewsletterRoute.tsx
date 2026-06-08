import { Alert, Box, CircularProgress } from '@mui/material'
import { useNewsletterEditor } from './newsletter/hooks/useNewsletterEditor'
import { ReviewNewsletterPage } from './newsletter/review/ReviewNewsletterPage'
import { useEffect } from 'react'

export function ReviewNewsletterRoute() {
  const vm = useNewsletterEditor()

  const { newsletter, navigate } = vm

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

  if (vm.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (vm.error) {
    return <Alert severity="error">{vm.error}</Alert>
  }

  if (!vm.newsletter) {
    return <Alert severity="warning">No se encontró el newsletter solicitado.</Alert>
  }

  return <ReviewNewsletterPage vm={vm} />
}
