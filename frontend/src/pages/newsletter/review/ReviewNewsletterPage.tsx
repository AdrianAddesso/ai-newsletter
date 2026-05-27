import { ReviewCommentControls } from '../components/ReviewCommentControls'

import { NewsletterViewer } from '../viewer/NewsletterViewer'

import { NewsletterEditorLayout } from '../editor/NewsletterEditorLayout'

import { useNewsletterEditor } from '../hooks/useNewsletterEditor'

type Props = {
  vm: ReturnType<typeof useNewsletterEditor>
}

export function ReviewNewsletterPage({ vm }: Props) {
  if (!vm.newsletter) return null

  return (
    <NewsletterEditorLayout
      left={
        <NewsletterViewer
          newsletter={vm.newsletter}
          selectedBlockId={vm.selectedBlockId}
          onSelectBlock={vm.setSelectedBlockId}
        />
      }
      right={
        vm.selectedBlock && (
          <ReviewCommentControls
            selectedBlock={vm.selectedBlock}
            newsletterComment={vm.newsletter.comment}
            onSaveNewsletterComment={async () => {}}
            onSaveBlockComment={async () => {}}
            onSendFeedback={async () => {
              await vm.transitionState('CHANGES_REQUESTED')
              vm.navigate('/dashboard')
            }}
            onApprove={async () => {
              await vm.transitionState('APPROVED')
              vm.navigate('/dashboard')
            }}
          />
        )
      }
    />
  )
}