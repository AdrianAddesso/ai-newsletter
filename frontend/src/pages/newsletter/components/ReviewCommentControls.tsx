import { type ChangeEvent } from 'react'
import { Button, Divider, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import type { BlockReviewComment, NewsletterBlock } from '../../../types/newsletter'
import { ReviewHistoryPanel } from './ReviewHistoryPanel'

type PendingReviewComment = {
  blockId: string
  blockName: string
  content: string
}

type Props = {
  selectedBlock: NewsletterBlock
  reviewHistory: BlockReviewComment[]
  draftComment: string
  pendingComments: PendingReviewComment[]
  isSubmitting: boolean
  onChangeDraftComment: (blockId: string, value: string) => void
  onAddPendingComment: (blockId: string) => void
  onRequestChanges: () => void
  onApprove: () => void
}

export function ReviewCommentControls({
  selectedBlock,
  reviewHistory,
  draftComment,
  pendingComments,
  isSubmitting,
  onChangeDraftComment,
  onAddPendingComment,
  onRequestChanges,
  onApprove,
}: Props) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChangeDraftComment(selectedBlock.id, event.target.value)
  }

  return (
    <Stack spacing={2}>
      <Tabs value={0}>
        <Tab label="Revisión" />
      </Tabs>

      <Typography variant="subtitle1">
        Comentario para {selectedBlock.name}
      </Typography>

      <TextField
        label="Comentario del bloque"
        value={draftComment}
        onChange={handleChange}
        multiline
        minRows={4}
        fullWidth
      />

      <Button
        variant="outlined"
        onClick={() => onAddPendingComment(selectedBlock.id)}
        disabled={isSubmitting || draftComment.trim().length === 0}
      >
        Agregar comentario
      </Button>

      <ReviewHistoryPanel
        comments={reviewHistory}
      />

      {pendingComments.length > 0 ? (
        <>
          <Divider />
          <Stack spacing={1}>
            <Typography variant="subtitle2">
              Comentarios cargados en esta revisión
            </Typography>
            {pendingComments.map((comment) => (
              <Stack
                key={comment.blockId}
                spacing={0.5}
                sx={{
                  border: '1px solid',
                  borderColor: comment.blockId === selectedBlock.id ? 'primary.main' : 'divider',
                  borderRadius: 1.5,
                  p: 1.5,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {comment.blockName}
                </Typography>
                <Typography variant="body2">{comment.content}</Typography>
              </Stack>
            ))}
          </Stack>
        </>
      ) : null}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <Button
          variant="outlined"
          color="warning"
          onClick={onRequestChanges}
          disabled={isSubmitting}
        >
          Solicitar cambios
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={onApprove}
          disabled={isSubmitting}
        >
          Aprobar
        </Button>
      </Stack>
    </Stack>
  )
}
