import { useState } from 'react'
import { ApprovedNewsletterPage } from './ApprovedNewsletterPage'
import { useNewsletterEditor } from '../hooks/useNewsletterEditor'
import { DuplicateNewsletterDialog } from '../components/DuplicateNewsletterDialog'
import { useNotification } from '../../../hooks/useNotification'

export function ApprovedNewsletterRoute() {
  const vm = useNewsletterEditor()
  const { error: notifyError, success } = useNotification()
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const newsletter = vm.newsletter;

  if (!newsletter) return null;

  const handleOpenDialog = () => {
    setNewTitle(newsletter.title);
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
  }

  const handleDuplicateSuccess = (newNewsletterId: string) => {
    success('Newsletter duplicado. Redirigiendo al editor...')
    setIsDuplicating(false)
    setShowDialog(false)
    vm.navigate(`/newsletters/edit/${newNewsletterId}`)
  }

  const handleError = (message: string) => {
    notifyError(message)
  }

  const handleProcessingChange = (isProcessing: boolean) => {
    setIsDuplicating(isProcessing)
  }

  return (
    <>
      <ApprovedNewsletterPage
        newsletter={newsletter}
        exportOptions={vm.exportOptions}
        exportingFormat={vm.exportingFormat}
        onExport={vm.handleExport}
        onDuplicate={handleOpenDialog}
        isDuplicating={isDuplicating}
      />

      <DuplicateNewsletterDialog
        open={showDialog}
        title={newTitle}
        newsletterId={newsletter.id}
        onClose={handleCloseDialog}
        onDuplicateSuccess={handleDuplicateSuccess}
        onError={handleError}
        onProcessingChange={handleProcessingChange}
        isProcessing={isDuplicating}
      />
    </>
  );
}
