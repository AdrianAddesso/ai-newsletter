import { Alert, Chip, Paper, Stack, Typography } from '@mui/material'
import type { NewsletterBlock } from '../../types/newsletter'

type Props = {
  blocks: NewsletterBlock[]
  selectedBlockId: string
  onSelectBlock: (id: string) => void
  readOnly?: boolean
}

const emptyComment = (v: string | null) => !v || v.trim().length === 0

export function BlockList({ blocks, selectedBlockId, onSelectBlock, readOnly = false }: Props) {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5">Bloques de la plantilla</Typography>
        {readOnly && <Chip label="Solo lectura" />}
      </Stack>
      <Stack spacing={1.5}>
        {blocks.map((block) => {
          const isSelected = block.id === selectedBlockId
          return (
            <Paper
              key={block.id}
              component="button"
              elevation={0}
              disabled={readOnly}
              onClick={() => onSelectBlock(block.id)}
              sx={{
                width: '100%',
                textAlign: 'left',
                border: '2px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: block.backgroundColor,
                color: 'text.primary',
                cursor: readOnly ? 'default' : 'pointer',
                p: 2,
              }}
            >
              <Typography variant="subtitle1">{block.name}</Typography>
              <Typography variant="body2">{block.text}</Typography>
              {!emptyComment(block.comment) && (
                <Alert severity="info" sx={{ mt: 1.5 }}>{block.comment}</Alert>
              )}
            </Paper>
          )
        })}
      </Stack>
    </Stack>
  )
}