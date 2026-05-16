import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import type { ChipProps } from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { useNavigate, useParams, useLocation } from 'react-router'
import {
  NewsletterStatus,
  NewsletterStatusLabel,
} from '../../../packages/shared/src/enums/newsletter-status.enum'
import {
  AreaNameLabel,
} from '../../../packages/shared/src/enums/area-name.enum'
import { updateNewsletterStatus } from '../api/newsletters'
import { useNotification } from '../hooks/useNotification'
import { useAuth } from '../contexts/AuthContext'

interface ReviewInfo {
  id: string
  title: string
  author: string
  area: string
  status: 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'RESUBMITTED'
  submittedDate: string
  content: string
}

const getStatusColor = (status: ReviewInfo['status']): ChipProps['color'] => {
  switch (status) {
    case NewsletterStatus.IN_REVIEW: return 'warning'
    case NewsletterStatus.CHANGES_REQUESTED: return 'error'
    case NewsletterStatus.RESUBMITTED: return 'info'
  }
}

const actionableStatuses = new Set<ReviewInfo['status']>([
  NewsletterStatus.IN_REVIEW,
  NewsletterStatus.RESUBMITTED,
])

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const { success, error } = useNotification()
  const { user } = useAuth()

  const review = location.state?.review as ReviewInfo | undefined

  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  if (!review) {
    return (
      <Box
        sx={{
          py: theme.nestle.page.sectionPaddingY,
          px: theme.nestle.page.sectionPaddingX,
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Stack spacing={3}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/reviews')}
              sx={{ alignSelf: 'flex-start' }}
            >
              Volver a revisiones
            </Button>
            <Typography variant="h5" color="text.secondary">
              No se encontró la revisión solicitada.
            </Typography>
          </Stack>
        </Container>
      </Box>
    )
  }

  const canTakeAction = actionableStatuses.has(review.status)

  const handleAction = async (newStatus: 'CHANGES_REQUESTED' | 'APPROVED') => {
    setLoading(true)
    try {
      await updateNewsletterStatus(review.id, newStatus, comment.trim() || null)

      const label = newStatus === 'APPROVED' ? 'aprobado' : 'enviado con ajustes pendientes'
      success(`Newsletter "${review.title}" ${label} correctamente`)

      navigate('/reviews', { state: { updatedId: review.id, newStatus } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar el estado'
      error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        py: theme.nestle.page.sectionPaddingY,
        px: theme.nestle.page.sectionPaddingX,
        bgcolor: 'background.default',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Stack spacing={4}>

          {/* Header */}
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Tooltip title="Volver a revisiones">
              <IconButton onClick={() => navigate('/reviews')}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Stack spacing={0.5}>
              <Typography variant="h2">{review.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                Enviado por {review.author} · {new Date(review.submittedDate).toLocaleDateString()}
              </Typography>
            </Stack>
          </Stack>

          {/* Info del newsletter */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Información</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Área</Typography>
                  <Typography variant="body2">
                    {AreaNameLabel[review.area as keyof typeof AreaNameLabel] ?? review.area}
                  </Typography>
                </Stack>
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Estado actual</Typography>
                  <Chip
                    label={NewsletterStatusLabel[review.status]}
                    color={getStatusColor(review.status)}
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                  />
                </Stack>
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Revisor</Typography>
                  <Typography variant="body2">{user?.name ?? '—'}</Typography>
                </Stack>
              </Stack>
              {review.content && (
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">Contenido</Typography>
                  <Typography variant="body2">{review.content}</Typography>
                </Stack>
              )}
            </Stack>
          </Card>

          {/* Comentario general (KAN-123) */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant="h6">Devolución general</Typography>
                <Typography variant="body2" color="text.secondary">
                  Podés ingresar un comentario general sobre el newsletter antes de tomar una acción.
                </Typography>
              </Stack>
              <TextField
                multiline
                minRows={4}
                maxRows={8}
                fullWidth
                placeholder="Escribí tu comentario aquí..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 1000 } }}
                helperText={`${comment.length}/1000`}
                disabled={!canTakeAction || loading}
              />
            </Stack>
          </Card>

          {/* Acciones (KAN-124 y KAN-125) */}
          {canTakeAction ? (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6">Acción de revisión</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={() => handleAction('CHANGES_REQUESTED')}
                    disabled={loading || !comment.trim()}
                  >
                    Solicitar ajustes
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleAction('APPROVED')}
                    disabled={loading}
                  >
                    Aprobar
                  </Button>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {comment.trim()
                    ? 'El comentario se guardará junto con la acción.'
                    : 'Podés aprobar o solicitar ajustes sin comentario.'}
                </Typography>
              </Stack>
            </Card>
          ) : (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3, bgcolor: 'action.hover' }}>
              <Typography variant="body2" color="text.secondary">
                Este newsletter está en estado <strong>{NewsletterStatusLabel[review.status]}</strong> y no admite acciones de revisión.
              </Typography>
            </Card>
          )}

        </Stack>
      </Container>
    </Box>
  )
}
