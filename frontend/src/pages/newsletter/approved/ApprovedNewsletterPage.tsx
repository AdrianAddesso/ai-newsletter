import { Box,Stack } from '@mui/material'

import { NewsletterViewer } from '../viewer/NewsletterViewer'

import { ApprovedNewsletterExport } from './ApprovedNewsletterExport'

import type {
  Newsletter,
  ExportFormat,
  ExportOption,
} from '../../../types/newsletter'

type Props = {
  newsletter: Newsletter
  exportOptions: ExportOption[]
  exportingFormat: ExportFormat | null
  onExport: (format: ExportFormat) => void
}

export function ApprovedNewsletterPage({
  newsletter,
  exportOptions,
  exportingFormat,
  onExport,
}: Props) {
  return (
    <Stack
      direction={{ xs:'column',lg:'row' }}
      spacing={3}
      sx={{ p:3 }}
    >
      <Box sx={{ flex:1 }}>
        <NewsletterViewer newsletter={newsletter} />
      </Box>

      <Box sx={{ width:{ lg:380 } }}>
        <ApprovedNewsletterExport
          exportOptions={exportOptions}
          exportingFormat={exportingFormat}
          onExport={onExport}
        />
      </Box>
    </Stack>
  )
}