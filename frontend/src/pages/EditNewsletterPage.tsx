import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material'

import { useNewsletterEditor } from './newsletter/hooks/useNewsletterEditor'
import { DraftNewsletterPage } from './newsletter/draft/DraftNewsletterPage'

export default function EditNewsletterPage() {
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

  if (!vm.newsletter) return null
  const newsletter = vm.newsletter

  if (vm.isApproved) {
    return (
      <Alert
        severity="info"
        action={
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              size="small"
              onClick={() =>
                vm.navigate(`/exportarNewsletter/${newsletter.id}`)
              }
            >
              Exportar
            </Button>

            <Button
              color="inherit"
              size="small"
              onClick={() => vm.navigate('/dashboard')}
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

  return <DraftNewsletterPage vm={vm} />
}
