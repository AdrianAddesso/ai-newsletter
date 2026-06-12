import { useEffect, useMemo, useState, type JSX, type MouseEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/FileDownloadOutlined'
import SearchBar from '../components/SearchBar'
import { getNewslettersAnalytics } from '../api/newsletters'
import type {
  NewsletterAnalyticsItem,
  NewsletterAnalyticsLogItem,
  NewsletterState,
} from '../types/newsletter'
import { NewsletterStatusLabel } from '@shared/enums/newsletter-status.enum'

type SortConfig = {
  key: 'newsletterName' | 'previousState' | 'newState' | 'createdAt'
  direction: 'asc' | 'desc'
}

const tableColumns: Array<{ key: SortConfig['key']; label: string }> = [
  { key: 'newsletterName', label: 'Título' },
  { key: 'previousState', label: 'Estado anterior' },
  { key: 'newState', label: 'Nuevo estado' },
  { key: 'createdAt', label: 'Fecha' },
]

const getStateLabel = (state: NewsletterState | null): string => {
  return state ? NewsletterStatusLabel[state] : '-'
}

const normalizeComments = (rawComments: string | null): string | null => {
  if (!rawComments) {
    return null
  }

  try {
    const parsed = JSON.parse(rawComments) as unknown

    if (!Array.isArray(parsed)) {
      return rawComments
    }

    const comments = parsed.flatMap((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return []
      }

      const content = (entry as { content?: unknown }).content
      return typeof content === 'string' && content.trim() ? [content.trim()] : []
    })

    return comments.length > 0 ? comments.join('\n\n') : rawComments
  } catch {
    return rawComments
  }
}

const escapeCsvValue = (value: string): string => {
  return `"${value.replace(/"/g, '""')}"`
}

export function AnalyticsPage(): JSX.Element {
  const [newsletters, setNewsletters] = useState<NewsletterAnalyticsItem[]>([])
  const [logs, setLogs] = useState<NewsletterAnalyticsLogItem[]>([])
  const [selectedNewsletter, setSelectedNewsletter] = useState<{
    id: string
    name: string
  } | null>(null)
  const [filterText, setFilterText] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc',
  })
  const [visibleRows, setVisibleRows] = useState(5)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentComments, setCurrentComments] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const loadAnalytics = async (): Promise<void> => {
      try {
        const response = await getNewslettersAnalytics()
        setNewsletters(response.newsletters)
        setLogs(response.logs)
        setLoadError(null)
      } catch {
        setNewsletters([])
        setLogs([])
        setLoadError('No se pudieron cargar las métricas de newsletters.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadAnalytics()
  }, [])

  const activeNewsletters = useMemo(() => {
    if (!selectedNewsletter) {
      return newsletters
    }

    return newsletters.filter((newsletter) => newsletter.id === selectedNewsletter.id)
  }, [newsletters, selectedNewsletter])

  const activeLogs = useMemo(() => {
    if (!selectedNewsletter) {
      return logs
    }

    return logs.filter((log) => log.newsletterId === selectedNewsletter.id)
  }, [logs, selectedNewsletter])

  const metrics = useMemo(() => {
    return [
      { label: 'Total de newsletters', value: activeNewsletters.length },
      {
        label: 'Rev. con comentarios',
        value: activeLogs.filter((log) => normalizeComments(log.allCommentaries)).length,
      },
      {
        label: 'Aprobados',
        value: activeNewsletters.filter((newsletter) => newsletter.state === 'APPROVED').length,
      },
      {
        label: 'Descartados',
        value: activeNewsletters.filter((newsletter) => newsletter.state === 'DISCARDED').length,
      },
    ]
  }, [activeLogs, activeNewsletters])

  const statusSegments = useMemo(() => {
    const counts: Record<NewsletterState, number> = {
      DRAFT: 0,
      IN_REVIEW: 0,
      CHANGES_REQUESTED: 0,
      RESUBMITTED: 0,
      APPROVED: 0,
      DISCARDED: 0,
    }

    activeNewsletters.forEach((newsletter) => {
      counts[newsletter.state] += 1
    })

    const total = activeNewsletters.length || 1

    return [
      {
        id: 'DRAFT',
        label: NewsletterStatusLabel.DRAFT,
        count: counts.DRAFT,
        color: 'grey.500',
        percentage: (counts.DRAFT / total) * 100,
      },
      {
        id: 'IN_REVIEW',
        label: NewsletterStatusLabel.IN_REVIEW,
        count: counts.IN_REVIEW,
        color: 'info.main',
        percentage: (counts.IN_REVIEW / total) * 100,
      },
      {
        id: 'CHANGES_REQUESTED',
        label: NewsletterStatusLabel.CHANGES_REQUESTED,
        count: counts.CHANGES_REQUESTED,
        color: 'warning.main',
        percentage: (counts.CHANGES_REQUESTED / total) * 100,
      },
      {
        id: 'RESUBMITTED',
        label: NewsletterStatusLabel.RESUBMITTED,
        count: counts.RESUBMITTED,
        color: 'secondary.main',
        percentage: (counts.RESUBMITTED / total) * 100,
      },
      {
        id: 'APPROVED',
        label: NewsletterStatusLabel.APPROVED,
        count: counts.APPROVED,
        color: 'success.main',
        percentage: (counts.APPROVED / total) * 100,
      },
      {
        id: 'DISCARDED',
        label: NewsletterStatusLabel.DISCARDED,
        count: counts.DISCARDED,
        color: 'error.main',
        percentage: (counts.DISCARDED / total) * 100,
      },
    ].filter((segment) => segment.count > 0)
  }, [activeNewsletters])

  const filteredAndSortedLogs = useMemo(() => {
    const normalizedFilter = filterText.trim().toLowerCase()
    const filtered = activeLogs.filter((log) => {
      if (!normalizedFilter) {
        return true
      }

      return [
        log.newsletterName,
        getStateLabel(log.previousState),
        getStateLabel(log.newState),
        normalizeComments(log.allCommentaries) ?? '',
      ].some((value) => value.toLowerCase().includes(normalizedFilter))
    })

    filtered.sort((left, right) => {
      const leftValue =
        sortConfig.key === 'previousState' || sortConfig.key === 'newState'
          ? getStateLabel(left[sortConfig.key])
          : String(left[sortConfig.key] ?? '')
      const rightValue =
        sortConfig.key === 'previousState' || sortConfig.key === 'newState'
          ? getStateLabel(right[sortConfig.key])
          : String(right[sortConfig.key] ?? '')

      if (leftValue < rightValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }

      if (leftValue > rightValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }

      return 0
    })

    return filtered
  }, [activeLogs, filterText, sortConfig])

  const handleSort = (key: SortConfig['key']): void => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleExport = (): void => {
    const headers = ['Título', 'Estado anterior', 'Nuevo estado', 'Fecha']
    const rows = filteredAndSortedLogs.map((log) => [
      log.newsletterName,
      getStateLabel(log.previousState),
      getStateLabel(log.newState),
      new Date(log.createdAt).toLocaleDateString(),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => escapeCsvValue(String(value))).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    const now = new Date()
    const timestamp = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}_${now.getHours()}-${String(now.getMinutes()).padStart(2, '0')}`
    anchor.download = `reporte-del-historial-newsletters-${timestamp}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleOpenComments = (event: MouseEvent, comments: string | null): void => {
    event.stopPropagation()
    setCurrentComments(normalizeComments(comments))
    setModalOpen(true)
  }

  return (
    <Box sx={{ py: 4, px: 3, bgcolor: 'background.default' }}>
      <Container maxWidth="lg" disableGutters>
        <Stack spacing={4}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
            }}
          >
            <Stack spacing={1}>
              <Typography variant="h2">Historial de estados</Typography>
              {selectedNewsletter ? (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
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
                  Visualizá el historial real de newsletters guardados en la base de datos.
                </Typography>
              )}
            </Stack>
          </Stack>

          {loadError ? <Alert severity="error">{loadError}</Alert> : null}

          {isLoading ? (
            <Stack sx={{ alignItems: 'center', py: 10 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: 'repeat(4, 1fr)',
                  },
                  gap: 2,
                }}
              >
                {metrics.map((metric) => (
                  <Card
                    key={metric.label}
                    elevation={0}
                    sx={{ border: '1px solid', borderColor: 'divider', p: 2.5 }}
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

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2.5 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Distribución de estados actuales (%)
                </Typography>

                {statusSegments.length === 0 ? (
                  <Alert severity="info">Todavía no hay newsletters guardados para analizar.</Alert>
                ) : (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        width: '100%',
                        height: 16,
                        borderRadius: 1,
                        overflow: 'hidden',
                        mb: 2,
                      }}
                    >
                      {statusSegments.map((segment) => (
                        <Box
                          key={segment.id}
                          sx={{
                            width: `${segment.percentage}%`,
                            bgcolor: segment.color,
                            transition: 'width 0.3s ease-in-out',
                          }}
                        />
                      ))}
                    </Box>

                    <Stack direction="row" spacing={3} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      {statusSegments.map((segment) => (
                        <Stack
                          key={`legend-${segment.id}`}
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: 'center' }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: segment.color,
                            }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {segment.label} ({segment.percentage.toFixed(1)}%)
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </>
                )}
              </Card>

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Box
                  sx={{
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'flex-end',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: 2,
                  }}
                >
                  <SearchBar value={filterText} onChange={setFilterText} />
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                    sx={{ whiteSpace: 'nowrap' }}
                    disabled={filteredAndSortedLogs.length === 0}
                  >
                    Exportar reporte
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
                              direction={sortConfig.key === key ? sortConfig.direction : 'asc'}
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
                      {filteredAndSortedLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                            <Stack spacing={1} sx={{ alignItems: 'center' }}>
                              <Typography variant="h6">No hay movimientos para mostrar</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {selectedNewsletter
                                  ? 'Este newsletter todavía no tiene cambios registrados en el historial.'
                                  : 'Todavía no hay cambios de estado registrados en la base de datos.'}
                              </Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAndSortedLogs.slice(0, visibleRows).map((log) => (
                          <TableRow
                            key={log.id}
                            hover
                            onClick={() =>
                              setSelectedNewsletter({
                                id: log.newsletterId,
                                name: log.newsletterName,
                              })
                            }
                            selected={selectedNewsletter?.id === log.newsletterId}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>
                              <Typography sx={{ fontWeight: 'bold' }}>
                                {log.newsletterName}
                              </Typography>
                            </TableCell>
                            <TableCell>{getStateLabel(log.previousState)}</TableCell>
                            <TableCell>
                              <Chip
                                label={getStateLabel(log.newState)}
                                size="small"
                                color={
                                  log.newState === 'APPROVED'
                                    ? 'success'
                                    : log.newState === 'DISCARDED'
                                      ? 'error'
                                      : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(log.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="center">
                              {normalizeComments(log.allCommentaries) ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={(event) =>
                                    handleOpenComments(event, log.allCommentaries)
                                  }
                                >
                                  Ver
                                </Button>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {visibleRows < filteredAndSortedLogs.length ? (
                  <Box
                    sx={{
                      p: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Button onClick={() => setVisibleRows((prev) => prev + 5)}>
                      Cargar más
                    </Button>
                  </Box>
                ) : null}
              </Card>
            </>
          )}
        </Stack>
      </Container>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Comentarios de revisión</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {currentComments}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
