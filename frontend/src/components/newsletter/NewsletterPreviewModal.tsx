import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material'

import CloseIcon from '@mui/icons-material/Close'

import { BlockList } from './BlockList'

import type { NewsletterBlock } from '../../types/newsletter'

import { getNewsletter } from '../../api/newsletters'

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
  const [blocks, setBlocks] = useState<NewsletterBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState('')

  useEffect(() => {
    const loadNewsletter = async () => {
      if (!newsletterId || !open) return

      try {
        const newsletter = await getNewsletter(newsletterId)

        const newsletterBlocks = newsletter.blocks || []

        setBlocks(newsletterBlocks)

        if (newsletterBlocks.length > 0) {
          setSelectedBlockId(newsletterBlocks[0].id)
        }
      } catch (error) {
        console.error('Error cargando preview:', error)
      }
    }

    void loadNewsletter()
  }, [newsletterId, open])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        Vista previa del newsletter

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <BlockList
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          readOnly
        />
      </DialogContent>
    </Dialog>
  )
}