import { useEffect,useState } from 'react'

import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
} from '@mui/material'

import CloseIcon from '@mui/icons-material/Close'

import { getNewsletter } from '../../../api/newsletters'

import type {
  Newsletter,
} from '../../../types/newsletter'

import { NewsletterViewer } from './NewsletterViewer'

type Props = {
  open: boolean
  newsletterId: string | null
  onClose: () => void
}

export function NewsletterPreviewModal({
  open,
  newsletterId,
  onClose,
}: Props) {
  const [newsletter,setNewsletter] =
    useState<Newsletter | null>(null)

  const [selectedBlockId,setSelectedBlockId] =
    useState('')

  useEffect(() => {
    const load = async () => {
      if (!newsletterId || !open) return

      try {
        const data =
          await getNewsletter(newsletterId)

        setNewsletter(data)

        setSelectedBlockId(
          data.blocks?.[0]?.id ?? '',
        )
      } catch (error) {
        console.error(error)
      }
    }

    void load()
  }, [newsletterId,open])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle
        sx={{
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center',
        }}
      >
        Vista previa

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {newsletter ? (
          <NewsletterViewer
            newsletter={newsletter}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            readOnly
          />
        ) : (
          <Stack
            sx={{
              py:8,
              alignItems:'center',
            }}
          >
            <CircularProgress />
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}