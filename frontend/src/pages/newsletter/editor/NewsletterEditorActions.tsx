import {
  Button,
  Stack,
} from '@mui/material'

type Props = {
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
  isSubmitting: boolean
}

export function NewsletterEditorActions({
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting,
}: Props) {
  return (
    <Stack
      direction="row"
      spacing={2}
    >
      <Button
        variant="outlined"
        onClick={onCancel}
      >
        Cancelar
      </Button>

      <Button
        variant="contained"
        disabled={isSubmitting}
        onClick={onSubmit}
      >
        {submitLabel}
      </Button>
    </Stack>
  )
}