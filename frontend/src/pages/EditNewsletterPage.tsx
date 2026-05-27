import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material'
import { useCallback } from 'react'
import { useParams } from 'react-router'

import { useNewsletterEditor } from './newsletter/hooks/useNewsletterEditor'
import { DraftNewsletterPage } from './newsletter/draft/DraftNewsletterPage'
import { ReviewNewsletterPage } from './newsletter/review/ReviewNewsletterPage'

import { NewsletterStepper, getStepFromState } from './newsletter/components/NewsletterStepper'

export default function EditNewsletterPage() {
  const vm = useNewsletterEditor()
  const { id } = useParams()

  const handleStepClick = useCallback((step: number) => {
    if (step === 0 && !vm.isReviewState) {
      vm.navigate('/crearNewsletter', {
        state: {
          newsletterId: id,
          templateId: vm.newsletter?.templateId,
          brandKitId: vm.newsletter?.brandKitId,
          generationRequest: vm.newsletter?.generationRequest,
        },
      })
    }
    if (step === 1 && vm.isReviewState) {
      const isCreator = vm.newsletter?.creatorUserId === vm.currentUserId
      void vm.transitionState('CHANGES_REQUESTED')
      if (!isCreator) vm.navigate('/dashboard')
    }
  }, [vm, id])

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

  const activeStep = Math.max(1, getStepFromState(vm.newsletter.state))

  if (vm.isReviewState) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <NewsletterStepper activeStep={activeStep} onStepClick={handleStepClick} />
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <ReviewNewsletterPage vm={vm} />
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <NewsletterStepper activeStep={activeStep} onStepClick={handleStepClick} />
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <DraftNewsletterPage vm={vm} />
      </Box>
    </Box>
  )
}
