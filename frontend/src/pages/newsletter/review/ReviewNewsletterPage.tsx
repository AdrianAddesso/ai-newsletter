import { useMemo, useState } from 'react'
import { ReviewCommentControls } from '../components/ReviewCommentControls'
import { NewsletterViewer } from '../viewer/NewsletterViewer'
import { NewsletterEditorLayout } from '../editor/NewsletterEditorLayout'
import { useNewsletterEditor } from '../hooks/useNewsletterEditor'
import {
  approveNewsletterReview,
  requestNewsletterChanges,
} from '../../../api/newsletters'
import { useNotification } from '../../../hooks/useNotification'

type Props = {
  editor: ReturnType<typeof useNewsletterEditor>
}

export function ReviewNewsletterPage({ editor }: Props) {
  const { success, error } = useNotification()
  const [draftComments, setDraftComments] = useState<Record<string, string>>({})
  const [pendingComments, setPendingComments] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const blockCommentsPayload = useMemo(() => {
    return Object.entries(pendingComments)
      .map(([blockId, content]) => ({
        blockId,
        content: content.trim(),
      }))
      .filter((comment) => comment.content.length > 0)
  }, [pendingComments])

  const pendingCommentsSummary = useMemo(() => {
    if (!editor.newsletter) {
      return []
    }

    return editor.newsletter.blocks
      .map((block) => ({
        blockId: block.id,
        blockName: block.name,
        content: (pendingComments[block.id] ?? '').trim(),
      }))
      .filter((comment) => comment.content.length > 0)
  }, [pendingComments, editor.newsletter])

  if (!editor.newsletter || !editor.selectedBlock) {
    return null
  }

  const handleRequestChanges = async () => {
    if (!editor.newsletter) {
      return
    }

    if (blockCommentsPayload.length === 0) {
      error('DebÃ©s dejar al menos un comentario para solicitar cambios.')
      return
    }

    setIsSubmitting(true)

    try {
      await requestNewsletterChanges(editor.newsletter.id, blockCommentsPayload)
      success('Cambios solicitados correctamente')
      editor.navigate('/reviews')
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'No se pudo solicitar cambios'
      error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async () => {
    if (!editor.newsletter) {
      return
    }

    setIsSubmitting(true)

    try {
      await approveNewsletterReview(editor.newsletter.id)
      success('Newsletter aprobado correctamente')
      editor.navigate('/reviews')
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'No se pudo aprobar el newsletter'
      error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <NewsletterEditorLayout
      left={(
        <NewsletterViewer
          newsletter={editor.newsletter}
          selectedBlockId={editor.selectedBlockId}
          onSelectBlock={editor.setSelectedBlockId}
        />
      )}
      right={(
        <ReviewCommentControls
          selectedBlock={editor.selectedBlock}
          reviewHistory={editor.selectedBlockReviewHistory}
          draftComment={draftComments[editor.selectedBlock.id] ?? ''}
          pendingComments={pendingCommentsSummary}
          isSubmitting={isSubmitting}
          onChangeDraftComment={(blockId, value) => {
            setDraftComments((current) => ({
              ...current,
              [blockId]: value,
            }))
          }}
          onAddPendingComment={(blockId) => {
            const nextComment = (draftComments[blockId] ?? '').trim()

            if (!nextComment) {
              return
            }

            setPendingComments((current) => ({
              ...current,
              [blockId]: nextComment,
            }))
            setDraftComments((current) => ({
              ...current,
              [blockId]: '',
            }))
          }}
          onRequestChanges={() => {
            void handleRequestChanges()
          }}
          onApprove={() => {
            void handleApprove()
          }}
        />
      )}
    />
  )
}
