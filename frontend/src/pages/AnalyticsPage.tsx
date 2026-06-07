import { useMemo, useState, type JSX, type MouseEvent } from 'react'
import {
  Box, Button, Card, Chip, Container, Stack, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TableSortLabel, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/FileDownloadOutlined'
import { useNavigate } from 'react-router'
import SearchBar from '../components/SearchBar'

type NewsletterState = 'DRAFT' | 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'RESUBMITTED' | 'APPROVED' | 'DISCARDED'

interface ReviewLog {
  id: string
  newsletter_id: string
  newsletter_name: string
  previous_state: NewsletterState
  new_state: NewsletterState
  reviewed_by_user_id: string
  all_commentaries: string | null
  created_at: string
}

interface SortConfig {
  key: keyof ReviewLog
  direction: 'asc' | 'desc'
}

const stateLabels: Record<NewsletterState, string> = {
  DRAFT: 'Borrador',
  IN_REVIEW: 'En revisión',
  CHANGES_REQUESTED: 'Cambios solicitados',
  RESUBMITTED: 'Reenviado',
  APPROVED: 'Aprobado',
  DISCARDED: 'Descartado',
}

const tableColumns: Array<{ key: keyof ReviewLog, label: string }> = [
  { key: 'newsletter_name', label: 'Título' },
  { key: 'previous_state', label: 'Estado anterior' },
  { key: 'new_state', label: 'Nuevo estado' },
  { key: 'created_at', label: 'Fecha' },
]

const DUMMY_LOGS: ReviewLog[] = Array.from({ length: 25 }).map((_, i) => {
  const newsletterId = `news-id-${(i % 5) + 1}`
  const newsletterName = `Newsletter Campaña ${(i % 5) + 1}`
  const states: NewsletterState[] = ['DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED']

  return {
    id: `log-${i}`,
    newsletter_id: newsletterId,
    newsletter_name: newsletterName,
    previous_state: states[Math.floor(Math.random() * 3)],
    new_state: states[Math.floor(Math.random() * 4)],
    reviewed_by_user_id: `user-${(i % 3) + 1}`,
    all_commentaries: i % 2 === 0 ? 'Revisión general aplicada. Se ajustaron márgenes y textos.' : null,
    created_at: new Date(Date.now() - i * 10000000).toISOString(),
  }
})

export function AnalyticsPage(): JSX.Element {
  const navigate = useNavigate()

  const [selectedNewsletter, setSelectedNewsletter] = useState<{ id: string, name: string } | null>(null)
  const [filterText, setFilterText] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'created_at',
    direction: 'desc',
  })
  const [visibleRows, setVisibleRows] = useState(5)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentComments, setCurrentComments] = useState<string | null>(null)

  const activeLogs = useMemo(() => {
    return selectedNewsletter
      ? DUMMY_LOGS.filter((log) => log.newsletter_id === selectedNewsletter.id)
      : DUMMY_LOGS
  }, [selectedNewsletter])

  const metrics = useMemo(() => [
    { label: 'Total de cambios', value: activeLogs.length },
    { label: 'Rev. con comentarios', value: activeLogs.filter((log) => log.all_commentaries).length },
    { label: 'Aprobaciones', value: activeLogs.filter((log) => log.new_state === 'APPROVED').length },
    { label: 'Descartados', value: activeLogs.filter((log) => log.new_state === 'DISCARDED').length },
  ], [activeLogs])

  const statusSegments = useMemo(() => {
    const counts: Record<NewsletterState, number> = {
      DRAFT: 0,
      IN_REVIEW: 0,
      CHANGES_REQUESTED: 0,
      RESUBMITTED: 0,
      APPROVED: 0,
      DISCARDED: 0,
    }

    activeLogs.forEach((log) => {
      counts[log.new_state] += 1
    })

    const total = activeLogs.length || 1

    return [
      { id: 'DRAFT', label: stateLabels.DRAFT, count: counts.DRAFT, color: 'grey.500', percentage: (counts.DRAFT / total) * 100 },
      { id: 'IN_REVIEW', label: stateLabels.IN_REVIEW, count: counts.IN_REVIEW, color: 'info.main', percentage: (counts.IN_REVIEW / total) * 100 },
      { id: 'CHANGES_REQUESTED', label: stateLabels.CHANGES_REQUESTED, count: counts.CHANGES_REQUESTED, color: 'warning.main', percentage: (counts.CHANGES_REQUESTED / total) * 100 },
      { id: 'APPROVED', label: stateLabels.APPROVED, count: counts.APPROVED, color: 'success.main', percentage: (counts.APPROVED / total) * 100 },
      { id: 'DISCARDED', label: stateLabels.DISCARDED, count: counts.DISCARDED, color: 'error.main', percentage: (counts.DISCARDED / total) * 100 },
    ].filter((segment) => segment.count > 0)
  }, [activeLogs])

  const filteredAndSortedLogs = useMemo(() => {
    const normalizedFilter = filterText.toLowerCase()
    const filtered = DUMMY_LOGS.filter((log) =>
      log.newsletter_name.toLowerCase().includes(normalizedFilter) ||
      stateLabels[log.new_state].toLowerCase().includes(normalizedFilter)
    )

    filtered.sort((a, b) => {
      const aVal = String(a[sortConfig.key])
      const bVal = String(b[sortConfig.key])

      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }

      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }

      return 0
    })

    return filtered
  }, [filterText, sortConfig])

  const handleSort = (key: keyof ReviewLog): void => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

    const handleExport = (): void => {
    const headers = ["Titulo", "Estado anterior", "Nuevo estado", "Fecha"];
    const rows = filteredAndSortedLogs.map((log) => [
        log.newsletter_name,
        stateLabels[log.previous_state],
        stateLabels[log.new_state],
        new Date(log.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date();
    const timestamp = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}_${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    a.download = `Reporte-del-historial-newsletters-${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    };

  const handleOpenComments = (event: MouseEvent, comments: string | null): void => {
    event.stopPropagation()
    setCurrentComments(comments)
    setModalOpen(true)
  }

  return (
    <Box sx={{ py: 4, px: 3, bgcolor: "background.default" }}>
      <Container maxWidth="lg" disableGutters>
        <Stack spacing={4}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
            }}
          >
            <Stack spacing={1}>
              <Typography variant="h2">Historial de estados</Typography>
              {selectedNewsletter ? (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <Typography variant="body1" color="text.secondary">
                    Viendo métricas para:
                  </Typography>
                  <Chip
                    label={selectedNewsletter.name}
                    onDelete={() => setSelectedNewsletter(null)}
                    color="primary"
                    variant="outlined"
                  />
                </Stack>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Visualiza el desempeño y cambios de tus campañas
                </Typography>
              )}
            </Stack>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            {metrics.map((metric) => (
              <Card
                key={metric.label}
                elevation={0}
                sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}
              >
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    {metric.label}
                  </Typography>
                  <Typography variant="h4">{metric.value}</Typography>
                </Stack>
              </Card>
            ))}
          </Box>

          <Card
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}
          >
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Distribución de estados (%)
            </Typography>

            <Box
              sx={{
                display: "flex",
                width: "100%",
                height: 16,
                borderRadius: 1,
                overflow: "hidden",
                mb: 2,
              }}
            >
              {statusSegments.map((segment) => (
                <Box
                  key={segment.id}
                  sx={{
                    width: `${segment.percentage}%`,
                    bgcolor: segment.color,
                    transition: "width 0.3s ease-in-out",
                  }}
                />
              ))}
            </Box>

            <Stack
              direction="row"
              spacing={3}
              useFlexGap
              sx={{ flexWrap: "wrap" }}
            >
              {statusSegments.map((segment) => (
                <Stack
                  key={`legend-${segment.id}`}
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: segment.color,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {segment.label} ({segment.percentage.toFixed(1)}%)
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Card>

          <Card
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider" }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "flex-end",
                alignItems: { xs: "stretch", sm: "center" },
                gap: 2,
              }}
            >
              <SearchBar value={filterText} onChange={setFilterText} />
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                sx={{ whiteSpace: "nowrap" }}
              >
                Exportar Reporte
              </Button>
            </Box>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    {tableColumns.map(({ key, label }) => (
                      <TableCell key={key}>
                        <TableSortLabel
                          active={sortConfig.key === key}
                          direction={
                            sortConfig.key === key
                              ? sortConfig.direction
                              : "asc"
                          }
                          onClick={() => handleSort(key)}
                        >
                          {label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                    <TableCell align="center">Comentarios</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedLogs.slice(0, visibleRows).map((log) => (
                    <TableRow
                      key={log.id}
                      hover
                      onClick={() =>
                        setSelectedNewsletter({
                          id: log.newsletter_id,
                          name: log.newsletter_name,
                        })
                      }
                      selected={selectedNewsletter?.id === log.newsletter_id}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: "bold" }}>
                          {log.newsletter_name}
                        </Typography>
                      </TableCell>
                      <TableCell>{stateLabels[log.previous_state]}</TableCell>
                      <TableCell>
                        <Chip
                          label={stateLabels[log.new_state]}
                          size="small"
                          color={
                            log.new_state === "APPROVED"
                              ? "success"
                              : log.new_state === "DISCARDED"
                                ? "error"
                                : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(log.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        {log.all_commentaries ? (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(event) =>
                              handleOpenComments(event, log.all_commentaries)
                            }
                          >
                            Ver
                          </Button>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {visibleRows < filteredAndSortedLogs.length && (
              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  justifyContent: "center",
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Button onClick={() => setVisibleRows((prev) => prev + 5)}>
                  Cargar más
                </Button>
              </Box>
            )}
          </Card>
        </Stack>
      </Container>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Comentarios de revisión</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
            {currentComments}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
