import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'
import { duplicateNewsletter } from '../../../api/newsletters'

type DuplicateNewsletterDialogProps = {
  open: boolean
  title: string
  newsletterId: string | null
  onClose: () => void
  onDuplicateSuccess: (newNewsletterId: string) => void
  onError?: (message: string) => void
  onProcessingChange?: (isProcessing: boolean) => void
  isProcessing?: boolean
  dialogTitle?: string
  confirmText?: string
}

export function DuplicateNewsletterDialog({
  open,
  title,
  newsletterId,
  onClose,
  onDuplicateSuccess,
  onError,
  onProcessingChange,
  isProcessing,
  dialogTitle = 'Crear nueva edición',
  confirmText = 'Crear',
}: DuplicateNewsletterDialogProps) {
  const [duplicateTitle, setDuplicateTitle] = useState(title)
  const [localProcessing, setLocalProcessing] = useState(false)

  const isBusy = isProcessing ?? localProcessing

  useEffect(() => {
    if (open) {
      setDuplicateTitle(title)
    }
  }, [open, title])

  const handleConfirm = async () => {
    const sanitizedTitle = duplicateTitle.trim()

    if (!sanitizedTitle) {
      onError?.('El nombre del newsletter no puede estar vacío')
      return
    }

    if (!newsletterId) {
      return
    }

    try {
      setLocalProcessing(true)
      onProcessingChange?.(true)
      const newNewsletter = await duplicateNewsletter(newsletterId, sanitizedTitle)
      onDuplicateSuccess(newNewsletter.id)
      onClose()
    } catch {
      onError?.('No se pudo duplicar el newsletter')
    } finally {
      setLocalProcessing(false)
      onProcessingChange?.(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent sx={{ px: 4 }}>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Nombre del newsletter"
            value={duplicateTitle}
            onChange={(e) => setDuplicateTitle(e.target.value)}
            placeholder="Ingresa el nombre para la nueva edición"
            disabled={isBusy}
            autoFocus
            margin="dense"
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isBusy}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={isBusy || !duplicateTitle.trim()}
        >
          {isBusy ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Duplicando...
            </>
          ) : (
            confirmText
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
