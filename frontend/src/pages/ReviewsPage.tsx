import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
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
import type { ChipProps } from '@mui/material'
import { useNavigate } from 'react-router'
import {
  NewsletterStatus,
  NewsletterStatusLabel,
} from '@shared/enums/newsletter-status.enum'
import {
  AreaNameLabel,
  type AreaName,
} from '@shared/enums/area-name.enum'
import SearchBar from '../components/SearchBar'
import { getReviewInbox } from '../api/newsletters'
import type { ReviewInboxItem } from '../types/newsletter'
import { useAuth } from '../contexts/AuthContext'

type SortableKey = 'title' | 'author' | 'area' | 'status' | 'submittedAt'

const getStatusColor = (
  status: ReviewInboxItem['status'],
): ChipProps['color'] => {
  switch (status) {
    case NewsletterStatus.IN_REVIEW:
      return 'warning'
    case NewsletterStatus.RESUBMITTED:
      return 'info'
  }
}

const reviewMatchesSearch = (
  review: ReviewInboxItem,
  normalizedSearch: string,
): boolean => {
  const searchableValues = [
    review.id,
    review.title,
    review.author,
    review.area ? AreaNameLabel[review.area] : '',
    NewsletterStatusLabel[review.status],
    review.submittedAt,
  ]

  return searchableValues.some((value) =>
    value.toLowerCase().includes(normalizedSearch),
  )
}

export function ReviewsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [reviews, setReviews] = useState<ReviewInboxItem[]>([])
  const [search, setSearch] = useState('')
  const [orderBy, setOrderBy] = useState<SortableKey>('submittedAt')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [limit, setLimit] = useState(5)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const reviewInbox = await getReviewInbox()
        setReviews(reviewInbox)
      } finally {
        setIsLoading(false)
      }
    }

    void loadReviews()
  }, [])

  const filteredReviews = useMemo(() => {
    const normalizedSearch = search.toLowerCase()

    return [...reviews]
      .filter((review) => reviewMatchesSearch(review, normalizedSearch))
      .sort((left, right) => {
        const leftValue = left[orderBy] ?? ''
        const rightValue = right[orderBy] ?? ''

        if (leftValue === rightValue) {
          return 0
        }

        return (leftValue < rightValue ? -1 : 1) * (order === 'asc' ? 1 : -1)
      })
  }, [order, orderBy, reviews, search])

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
        bgcolor: 'background.default',
        height: '100vh',
        overflowY: 'auto',
        scrollbarGutter: 'stable',
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Stack spacing={4}>
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', alignItems: 'flex-end' }}
          >
            <Stack spacing={1}>
              <Typography variant="h2">Revisión de Newsletters</Typography>
              <Typography variant="body1" color="text.secondary">
                {user?.role === 'ADMIN'
                  ? 'Revisá todos los newsletters pendientes.'
                  : 'Revisá todos los newsletters pendientes.'}
              </Typography>
            </Stack>

            <SearchBar value={search} onChange={setSearch} />
          </Stack>

          <TableContainer
            component={Card}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell>{sortLabel('Título', 'title')}</TableCell>
                  <TableCell>{sortLabel('Autor', 'author')}</TableCell>
                  <TableCell>{sortLabel('Área', 'area')}</TableCell>
                  <TableCell>{sortLabel('Estado', 'status')}</TableCell>
                  <TableCell>{sortLabel('Fecha', 'submittedAt')}</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {!isLoading && filteredReviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Stack spacing={1} sx={{ alignItems: 'center' }}>
                        <Typography variant="h6">No hay newsletters pendientes</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cuando haya newsletters en revisión o reenviados, se mostrarán acá.
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReviews.slice(0, limit).map((review) => (
                    <TableRow key={review.id} hover>
                      <TableCell>{review.title}</TableCell>
                      <TableCell>{review.author}</TableCell>
                      <TableCell>
                        {review.area ? AreaNameLabel[review.area as AreaName] : 'Sin área'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={NewsletterStatusLabel[review.status]}
                          color={getStatusColor(review.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(review.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          onClick={() => navigate(`/reviewNewsletter/${review.id}`)}
                        >
                          Revisar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {limit < filteredReviews.length ? (
            <Stack sx={{ alignItems: 'center' }}>
              <Button onClick={() => setLimit((current) => current + 5)}>
                Cargar más
              </Button>
            </Stack>
          ) : null}
        </Stack>
      </Container>
    </Box>
  )
}
