import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import type { ChipProps } from '@mui/material'
import { RateReviewOutlined as ReviewIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router'
import {
  NewsletterStatus,
  NewsletterStatusLabel,
  type NewsletterStatus as NewsletterStatusValue,
} from '@shared/enums/newsletter-status.enum'
import {
  AreaName,
  AreaNameLabel,
  type AreaName as AreaNameValue,
} from '@shared/enums/area-name.enum'
import { useAuth, type User } from '../contexts/AuthContext'
import SearchBar from '../components/SearchBar'
import { useLocation } from 'react-router'
import { seedNewsletterIfMissing } from '../api/newsletters'

type NewsletterReviewStatus = Extract<
  NewsletterStatusValue,
  typeof NewsletterStatus.IN_REVIEW |
  typeof NewsletterStatus.CHANGES_REQUESTED |
  typeof NewsletterStatus.RESUBMITTED
>

const actionableReviewStatuses = new Set<NewsletterReviewStatus>([
  NewsletterStatus.IN_REVIEW,
  NewsletterStatus.RESUBMITTED,
])

interface NewsletterReview {
  id: string
  title: string
  author: string
  area: AreaNameValue
  status: NewsletterReviewStatus
  submittedDate: string
  content: string
}

const initialReviews: NewsletterReview[] = [
  {
    id: "1",
    title: "Newsletter - Marzo 2024",
    author: "Juan Perez",
    area: AreaName.COMUNICACION_INTERNA,
    status: NewsletterStatus.IN_REVIEW,
    submittedDate: "2024-03-15",
    content: "Contenido de newsletter para marzo...",
  },
  {
    id: "2",
    title: "Promocion de Primavera",
    author: "Maria Garcia",
    area: AreaName.COMUNICACION_CORPORATIVA,
    status: NewsletterStatus.CHANGES_REQUESTED,
    submittedDate: "2024-03-16",
    content: "Contenido de promocion...",
  },
  {
    id: "3",
    title: "Newsletter - Febrero 2024",
    author: "Pedro Lopez",
    area: AreaName.COMUNICACION_INTERNA,
    status: NewsletterStatus.RESUBMITTED,
    submittedDate: "2024-02-28",
    content: "Contenido aprobado...",
  },
    {
    id: "4",
    title: "Promocion de Primavera",
    author: "Maria Garcia",
    area: AreaName.COMUNICACION_CORPORATIVA,
    status: NewsletterStatus.RESUBMITTED,
    submittedDate: "2024-03-16",
    content: "Contenido de promocion...",
  },
];

const getStatusColor = (status: NewsletterReview['status']): ChipProps['color'] => {
  switch (status) {
    case NewsletterStatus.IN_REVIEW: return 'warning'
    case NewsletterStatus.CHANGES_REQUESTED: return 'error'
    case NewsletterStatus.RESUBMITTED: return 'info'
  }
}

const getStatusLabel = (status: NewsletterReview['status']) => {
  return NewsletterStatusLabel[status]
}

type SortableKey = 'title' | 'author' | 'area' | 'status' | 'submittedDate'

const reviewMatchesSearch = (review: NewsletterReview, normalizedSearch: string): boolean => {
  const searchableValues = [
    review.id,
    review.title,
    review.author,
    AreaNameLabel[review.area],
    NewsletterStatusLabel[review.status],
    review.submittedDate,
    review.content,
  ]

  return searchableValues.some((value) => value.toLowerCase().includes(normalizedSearch))
}

const isAreaName = (value: unknown): value is AreaNameValue => {
  return Object.values(AreaName).some((areaName) => areaName === value)
}

const getUserArea = (user: User | null): AreaNameValue | null => {
  const userArea = user?.area

  if (!isAreaName(userArea)) {
    return null
  }

  return userArea
}

export function ReviewsPage() {
  const { user } = useAuth()
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const [reviews, setReviews] = useState<NewsletterReview[]>(initialReviews)
  const appliedRef = useRef<string | null>(null)

  useEffect(() => {
    initialReviews.forEach((r) => seedNewsletterIfMissing(r.id, r.status))
  }, [])

  useEffect(() => {
    const { updatedId, newStatus } = (location.state ?? {}) as { updatedId?: string; newStatus?: string }
    if (!updatedId || !newStatus || appliedRef.current === updatedId + newStatus) return
    appliedRef.current = updatedId + newStatus
    if (newStatus === 'APPROVED') {
      setReviews((prev) => prev.filter((r) => r.id !== updatedId))
    } else {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === updatedId ? { ...r, status: newStatus as NewsletterReview['status'] } : r,
        ),
      )
    }
  }, [location.state])

  const [search, setSearch]   = useState('')
  const [orderBy, setOrderBy] = useState<SortableKey>('submittedDate')
  const [order, setOrder]     = useState<'asc' | 'desc'>('desc')
  const [limit, setLimit]     = useState(5)

  const isAdmin = user?.role === 'ADMIN'
  const userArea = getUserArea(user)

  const filteredReviews = useMemo(() => {
    const normalizedSearch = search.toLowerCase()

    return reviews
      .filter((r) => isAdmin || !userArea || r.area === userArea)
      .filter((r) => reviewMatchesSearch(r, normalizedSearch))
      .sort((a, b) => {
        const isAsc = order === 'asc'
        return (a[orderBy] < b[orderBy] ? -1 : 1) * (isAsc ? 1 : -1)
      })
  }, [reviews, search, order, orderBy, isAdmin, userArea])

  const handleRequestSort = (property: SortableKey) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const sortLabel = (label: string, key: SortableKey) => (
    <TableSortLabel
      active={orderBy === key}
      direction={orderBy === key ? order : 'asc'}
      onClick={() => handleRequestSort(key)}
    >
      {label}
    </TableSortLabel>
  )

  return (
    <Box
      sx={{
        py: 4,
        px: 3,
        bgcolor: "background.default",
        height: "100vh",
        overflowY: "auto",
        scrollbarGutter: "stable",
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Stack spacing={4}>
          {/* Header */}
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "flex-end" }}
          >
            <Stack spacing={1}>
              <Typography variant="h2">Revisión de Newsletters</Typography>
              <Typography variant="body1" color="text.secondary">
                {isAdmin
                  ? "Revisá todos los newsletters pendientes."
                  : userArea
                    ? `Mostrando newsletters de tu área: ${AreaNameLabel[userArea]}.`
                    : "Mostrando newsletters para revisión."}
              </Typography>
            </Stack>

            <SearchBar value={search} onChange={setSearch} />
          </Stack>

          {/* Tabla */}
          <TableContainer
            component={Card}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            <Table>
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell>{sortLabel("Título", "title")}</TableCell>
                  <TableCell>{sortLabel("Autor", "author")}</TableCell>
                  <TableCell>{sortLabel("Área", "area")}</TableCell>
                  <TableCell>{sortLabel("Estado", "status")}</TableCell>
                  <TableCell>{sortLabel("Fecha", "submittedDate")}</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredReviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Stack spacing={1} sx={{ alignItems: "center" }}>
                        <Typography variant="h6">¡Todo al día! 🎉</Typography>
                        <Typography variant="body2" color="text.secondary">
                          No hay newsletters pendientes de revisión por ahora.
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReviews.slice(0, limit).map((review) => (
                    <TableRow key={review.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {review.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{ maxWidth: 220, display: "block" }}
                        >
                          {review.content}
                        </Typography>
                      </TableCell>

                      <TableCell>{review.author}</TableCell>
                      <TableCell>{AreaNameLabel[review.area]}</TableCell>

                      <TableCell>
                        <Chip
                          label={getStatusLabel(review.status)}
                          color={getStatusColor(review.status)}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        {new Date(review.submittedDate).toLocaleDateString()}
                      </TableCell>

                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{ justifyContent: "flex-end" }}
                        >
                          {actionableReviewStatuses.has(review.status) && (
                            <Tooltip title="Revisar">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() =>
                                  navigate(`/reviews/${review.id}`, {
                                    state: { review },
                                  })
                                }
                              >
                                <ReviewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {limit < filteredReviews.length && (
              <Box
                sx={{
                  p: 2,
                  textAlign: "center",
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Button onClick={() => setLimit((l) => l + 5)}>
                  Cargar más
                </Button>
              </Box>
            )}
          </TableContainer>
        </Stack>
      </Container>
    </Box>
  );
}
