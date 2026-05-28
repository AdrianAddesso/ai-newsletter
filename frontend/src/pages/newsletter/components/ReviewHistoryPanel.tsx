import { Divider, Stack, Typography } from '@mui/material'
import type { BlockReviewComment } from '../../../types/newsletter'

type Props = {
  comments: BlockReviewComment[]
  title?: string
}

export function ReviewHistoryPanel({
  comments,
  title = 'Historial de comentarios',
}: Props) {
  if (comments.length === 0) {
    return null
  }

  return (
    <Stack spacing={1.5}>
      <Divider />
      <Stack spacing={1}>
        <Typography variant="subtitle2">{title}</Typography>
        {comments.map((comment) => (
          <Stack
            key={comment.id}
            spacing={0.5}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
              p: 1.5,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {comment.commentedByName} · {new Date(comment.commentedAt).toLocaleString()}
            </Typography>
            <Typography variant="body2">{comment.content}</Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}
