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
  onDuplicate: () => void
  isDuplicating: boolean
}

export function ApprovedNewsletterPage({
  newsletter,
  exportOptions,
  exportingFormat,
  onExport,
  onDuplicate,
  isDuplicating,
}: Props) {
  return (
    <Stack
      direction={{ xs:'column',lg:'row' }}
      spacing={3}
      sx={{ p:3 }}
    >
      <Box data-onboarding="approved-preview" sx={{ flex:1, minWidth:0, }}>
        <Box
          sx={{
            width: '100%',
            overflowX: 'auto',
          }}
        >
          <Box sx={{ width: 'fit-content', mx: 'auto' }}>
            <ApprovedNewsletterViewer
              blocks={newsletter.blocks}
              format={newsletter.format}
            />
          </Box>
        </Box>
      </Box>

      <Box data-onboarding="export-actions" sx={{ width:{ lg:380 } }}>
        <ApprovedNewsletterExport
          exportOptions={exportOptions}
          exportingFormat={exportingFormat}
          onExport={onExport}
          onDuplicate={onDuplicate}
          isDuplicating={isDuplicating}
        />
      </Box>
    </Stack>
  )
}
