import { Box,Stack } from '@mui/material'
import { ApprovedNewsletterExport } from './ApprovedNewsletterExport'
import { ApprovedNewsletterViewer } from './ApprovedNewsletterViewer'

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
      <Box sx={{ flex:1, minWidth:0, }}>
          <Box sx={{ maxWidth: 1000, mx: 'auto', }}>
            <ApprovedNewsletterViewer blocks={newsletter.blocks} />
          </Box>
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
