import { Alert, Box, CircularProgress } from '@mui/material'
import { useNewsletterEditor } from './newsletter/hooks/useNewsletterEditor'
import { ReviewNewsletterPage } from './newsletter/review/ReviewNewsletterPage'

export function ReviewNewsletterRoute() {
  const vm = useNewsletterEditor()

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
