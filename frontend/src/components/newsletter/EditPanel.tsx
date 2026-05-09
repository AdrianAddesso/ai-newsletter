import { type ChangeEvent } from 'react'
import {
  Alert,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { NewsletterBlock, NewsletterState } from '../../types/newsletter'

type Props = {
  selectedBlock: NewsletterBlock
  newsletterComment: string | null
  newsletterState: NewsletterState
  submitLabel: string
  isSubmitting: boolean
  isRegeneratingBlock: boolean
  aiError: string | null
  onUpdateText: (blockId: string, value: string) => void
  onUpdateBackground: (blockId: string, value: string) => void
  onRegenerateBlock: (blockId: string) => Promise<void>
  onRegenerateAll: () => void
  onSubmit: () => void
  onCancel: () => void
}

const emptyComment = (v: string | null) => !v || v.trim().length === 0

export function EditPanel({
  selectedBlock,
  newsletterComment,
  newsletterState,
  submitLabel,
  isSubmitting,
  isRegeneratingBlock,
  aiError,
  onUpdateText,
  onUpdateBackground,
  onRegenerateBlock,
  onRegenerateAll,
  onSubmit,
  onCancel,
}: Props) {
  const canEdit = newsletterState === 'DRAFT' || newsletterState === 'CHANGES_REQUESTED'

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">{selectedBlock.name}</Typography>
      {aiError && <Alert severity="error">{aiError}</Alert>}

      <TextField
        label="Texto"
        value={selectedBlock.text}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdateText(selectedBlock.id, e.target.value)}
        multiline
        minRows={3}
        fullWidth
        disabled={!canEdit}
      />
      <TextField
        label="Fondo"
        type="color"
        value={selectedBlock.backgroundColor}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdateBackground(selectedBlock.id, e.target.value)}
        fullWidth
        disabled={!canEdit}
      />

      {canEdit && (
        <>
          <Button
            variant="outlined"
            color="secondary"
            disabled={isRegeneratingBlock}
            onClick={() => void onRegenerateBlock(selectedBlock.id)}
          >
            {isRegeneratingBlock ? 'Regenerando bloque...' : 'Regenerar este bloque con IA'}
          </Button>
          <Button variant="outlined" color="secondary" onClick={onRegenerateAll}>
            Regenerar todo el contenido
          </Button>
        </>
      )}

      {!emptyComment(newsletterComment) && (
        <Alert severity="info">{newsletterComment}</Alert>
      )}

      <Divider />

      <Button variant="contained" onClick={onSubmit} disabled={isSubmitting || !canEdit}>
        {isSubmitting ? 'Enviando...' : submitLabel}
      </Button>
      <Button variant="outlined" color="error" onClick={onCancel} disabled={isSubmitting}>
        Cancelar
      </Button>
    </Stack>
  )
}