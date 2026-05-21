import { Alert,Box,CircularProgress } from '@mui/material'

import { useNewsletterEditor } from './newsletter/hooks/useNewsletterEditor'

import { ApprovedNewsletterPage } from './newsletter/approved/ApprovedNewsletterPage'

import { DraftNewsletterPage } from './newsletter/draft/DraftNewsletterPage'

import { ReviewNewsletterPage } from './newsletter/review/ReviewNewsletterPage'

export default function EditNewsletterPage() {
  const vm = useNewsletterEditor()

  if (vm.isLoading) {
    return (
      <Box sx={{ display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (vm.error) {
    return <Alert severity="error">{vm.error}</Alert>
  }

  if (!vm.newsletter) return null

  if (vm.isApproved) {
    return (
      <ApprovedNewsletterPage
        newsletter={vm.newsletter}
        exportOptions={vm.exportOptions}
        exportingFormat={vm.exportingFormat}
        onExport={vm.handleExport}
      />
    )
  }

  if (vm.isReviewState) {
    return <ReviewNewsletterPage vm={vm} />
  }

  return <DraftNewsletterPage vm={vm} />
}