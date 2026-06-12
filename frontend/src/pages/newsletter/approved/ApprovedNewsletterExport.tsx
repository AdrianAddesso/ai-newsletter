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
import ContentCopyIcon from "@mui/icons-material/ContentCopy";  
import CircularProgress from "@mui/material/CircularProgress";
type Props = {
  exportOptions: ExportOption[]
  exportingFormat: ExportFormat | null
  onExport: (format: ExportFormat) => void
  onDuplicate: () => void
  isDuplicating: boolean
}

export function ApprovedNewsletterExport({
  exportOptions,
  exportingFormat,
  onExport,
  onDuplicate,
  isDuplicating,
}: Props) {
  return (
    <Stack spacing={2}>
      <Tabs value={0}>
        <Tab label="Acciones" />
      </Tabs>

      <Typography variant="h5">Listo para publicación</Typography>

      {exportOptions.map((opt) => (
        <Button
          key={opt.id}
          fullWidth
          variant="contained"
          disabled={exportingFormat !== null || isDuplicating}
          onClick={() => void onExport(opt.format)}
        >
          {exportingFormat === opt.format ? "Exportando..." : opt.label}
        </Button>
      ))}

      <Button
        fullWidth
        variant="outlined"
        color="error"
        startIcon={
          isDuplicating ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <ContentCopyIcon />
          )
        }
        disabled={isDuplicating || exportingFormat !== null}
        onClick={onDuplicate}
      >
        {isDuplicating ? "Copiando..." : "Copiar Newsletter"}
      </Button>
    </Stack>
  );
}