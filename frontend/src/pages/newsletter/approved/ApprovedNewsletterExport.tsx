import {
  Button,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'

import type {
  ExportFormat,
  ExportOption,
} from '../../../types/newsletter'

type Props = {
  exportOptions: ExportOption[]
  exportingFormat: ExportFormat | null
  onExport: (format: ExportFormat) => void
}

export function ApprovedNewsletterExport({
  exportOptions,
  exportingFormat,
  onExport,
}: Props) {
  return (
    <Stack spacing={2}>
      <Tabs value={0}>
        <Tab label="Exportar" />
      </Tabs>

      <Typography variant="h5">
        Listo para publicación
      </Typography>

      {/*{exportOptions.map((opt) => (
        <Button
          key={opt.id}
          variant="contained"
          disabled={exportingFormat !== null}
          onClick={() => void onExport(opt.format)}
        >
          {exportingFormat === opt.format
            ? 'Exportando...'
            : opt.label}
        </Button>
      ))}
      */}

      {exportOptions.map((opt) => {
        const isEml = opt.format === 'EML'

        return (
          <Button
            key={opt.id}
            variant="contained"
            disabled={isEml || exportingFormat !== null}
            onClick={() => {
              if (isEml) return

              void onExport(opt.format)
            }}
            sx={
              isEml
                ? {
                    bgcolor: 'grey.400',
                    color: 'grey.700',
                    '&.Mui-disabled': {
                      bgcolor: 'grey.300',
                      color: 'grey.600',
                    },
                  }
                : undefined
            }
          >
            {isEml
              ? 'Exportar EML'
              : exportingFormat === opt.format
                ? 'Exportando...'
                : opt.label}
          </Button>
  )
})}        
    </Stack>
  )
}