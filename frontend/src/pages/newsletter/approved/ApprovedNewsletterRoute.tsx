import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Box,
} from '@mui/material'
import { ApprovedNewsletterPage } from './ApprovedNewsletterPage'
import { useNewsletterEditor } from '../hooks/useNewsletterEditor'
import { duplicateNewsletter } from '../../../api/newsletters'
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

  const handleConfirmDuplicate = async () => {
    if (!newTitle.trim()) {
      notifyError('El nombre del newsletter no puede estar vacío')
      return
    }

    try {
      setIsDuplicating(true)
      const newNewsletter = await duplicateNewsletter(newsletter.id, newTitle);
      success('Newsletter duplicado. Redirigiendo al editor...')
      handleCloseDialog()
      vm.navigate(`/editarNewsletter/${newNewsletter.id}`)
    } catch (err) {
      notifyError('No se pudo duplicar el newsletter')
    } finally {
      setIsDuplicating(false)
    }
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

      <Dialog
        open={showDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ px: 1 }}>Copiar newsletter</DialogTitle>
        <DialogContent sx={{ px: 4 }}>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nombre de la copia"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ingresa el nombre para la nueva edición"
              disabled={isDuplicating}
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
          <Button onClick={handleCloseDialog} disabled={isDuplicating}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDuplicate}
            variant="contained"
            disabled={isDuplicating || !newTitle.trim()}
          >
            {isDuplicating ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Duplicando...
              </>
            ) : (
              "Crear"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}