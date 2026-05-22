import { Chip } from '@mui/material'

import {
  NewsletterStatus,
  NewsletterStatusLabel,
} from '../../../../../packages/shared/src/enums/newsletter-status.enum'

type Props = {
  status: NewsletterStatus
}

export function NewsletterStatusChip({
  status,
}: Props) {
  const color =
    status === NewsletterStatus.APPROVED
      ? 'success'
      : status === NewsletterStatus.DRAFT
        ? 'default'
        : 'warning'

  return (
    <Chip
      size="small"
      label={NewsletterStatusLabel[status]}
      color={color}
    />
  )
}