import { useState, type ChangeEvent } from 'react'
import { Button, Divider, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import type { NewsletterBlock } from '../../../types/newsletter'

type Props = {
  selectedBlock: NewsletterBlock
  newsletterComment: string | null
  onSaveNewsletterComment: (value: string) => void
  onSaveBlockComment: (blockId: string, value: string) => void
  onSendFeedback: () => void
  onApprove: () => void
}

export function ReviewCommentControls({
  selectedBlock,
  newsletterComment,
  onSaveNewsletterComment,
  onSaveBlockComment,
  onSendFeedback,
  onApprove,
}: Props) {
  const [localComment, setLocalComment] = useState(newsletterComment ?? '')
  const [blockComment, setBlockComment] = useState(selectedBlock.comment ?? '')

  return (
    <Stack spacing={2}>
      <Tabs value={0}><Tab label="Revision" /></Tabs>
      <TextField
        label="Comentario del newsletter"
        value={localComment}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setLocalComment(e.target.value)}
        multiline
        minRows={3}
        fullWidth
      />
      <Button variant="outlined" onClick={() => onSaveNewsletterComment(localComment)}>
        Guardar comentario general
      </Button>
      <Divider />
      <Typography variant="subtitle1">Comentario para {selectedBlock.name}</Typography>
      <TextField
        label="Comentario del bloque"
        value={blockComment}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setBlockComment(e.target.value)}
        multiline
        minRows={3}
        fullWidth
      />
      <Button variant="outlined" onClick={() => onSaveBlockComment(selectedBlock.id, blockComment)}>
        Guardar comentario del bloque
      </Button>
      <Divider />
      <Button variant="outlined" color="warning" onClick={onSendFeedback}>Enviar feedback</Button>
      <Button variant="contained" color="success" onClick={onApprove}>Aprobar</Button>
    </Stack>
  )
}