import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  NewsletterStatus,
  NewsletterStatusLabel,
} from '../../../../packages/shared/src/enums/newsletter-status.enum';
import { ModalDelete } from '../ModalDelete';
import { TableSortLabel } from '@mui/material';
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from 'react-router';
//import { useEffect } from 'react';
//import { getAllNewsletters } from '../../api/newsletters';

interface NewsletterRow {
  id: string;
  title: string;
  autor: string;
  state: NewsletterStatus;
  language: string;
  reviewer: string;
  publish_date: string | null;
  updated_at: string;
}

interface Props {
  search: string;
  filter: 'ALL' | 'PENDING';
}

const pendingStatuses = new Set<NewsletterStatus>([
  NewsletterStatus.IN_REVIEW,
  NewsletterStatus.CHANGES_REQUESTED,
  NewsletterStatus.RESUBMITTED,
]);

const getStatusColor = (status: NewsletterStatus) => {
  switch (status) {
    case NewsletterStatus.IN_REVIEW:
    case NewsletterStatus.CHANGES_REQUESTED:
    case NewsletterStatus.RESUBMITTED:
      return 'warning';
    case NewsletterStatus.APPROVED:
      return 'success';
    case NewsletterStatus.DISCARDED:
      return 'error';
    case NewsletterStatus.DRAFT:
      return 'default';
    default: return 'default';
  }
};

const mockNewsletters: NewsletterRow[] = [
  {
    id: '1',
    title: 'Newsletter 1',
    autor: 'autor 1',
    state: NewsletterStatus.IN_REVIEW,
    language: 'English',
    reviewer: 'revisor 1',
    publish_date: '01-10-2023',
    updated_at: '30-09-2023',
  },
  {
    id: '2',
    title: 'Newsletter 2',
    autor: 'autor 2',
    state: NewsletterStatus.APPROVED,
    language: 'Spanish',
    reviewer: 'admin',
    publish_date: '02-10-2023',
    updated_at: '30-09-2023',
  },
  {
    id: '3',
    title: 'Newsletter 3',
    autor: 'autor 3',
    state: NewsletterStatus.CHANGES_REQUESTED,
    language: 'French',
    reviewer: 'revisor 2',
    publish_date: '03-10-2023',
    updated_at: '28-09-2023',
  },
  {
    id: '4',
    title: 'Newsletter 4',
    autor: 'autor 4',
    state: NewsletterStatus.DRAFT,
    language: 'English',
    reviewer: 'admin',
    publish_date: null,
    updated_at: '27-09-2023',
  },
  {
    id: '5',
    title: 'Newsletter 5',
    autor: 'autor 2',
    state: NewsletterStatus.RESUBMITTED,
    language: 'Spanish',
    reviewer: 'revisor 3',
    publish_date: '04-10-2023',
    updated_at: '26-09-2023',
  },
  {
    id: '6',
    title: 'Newsletter 6',
    autor: 'autor 1',
    state: NewsletterStatus.APPROVED,
    language: 'French',
    reviewer: 'admin',
    publish_date: '05-10-2023',
    updated_at: '25-09-2023',
  },
  {
    id: '7',
    title: 'Newsletter 7',
    autor: 'autor 2',
    state: NewsletterStatus.DISCARDED,
    language: 'English',
    reviewer: 'revisor 4',
    publish_date: '06-10-2023',
    updated_at: '24-09-2023',
  },
  {
    id: '8',
    title: 'Newsletter 8',
    autor: 'autor 5',
    state: NewsletterStatus.DRAFT,
    language: 'Spanish',
    reviewer: 'admin',
    publish_date: null,
    updated_at: '23-09-2023',
  },
  {
    id: '9',
    title: 'Newsletter 9',
    autor: 'autor 3',
    state: NewsletterStatus.IN_REVIEW,
    language: 'French',
    reviewer: 'revisor 4',
    publish_date: '07-10-2023',
    updated_at: '22-09-2023',
  },
  {
    id: '10',
    title: 'Newsletter 10',
    autor: 'autor 1',
    state: NewsletterStatus.APPROVED,
    language: 'English',
    reviewer: 'revisor 1',
    publish_date: '08-10-2023',
    updated_at: '21-09-2023',
  },
];

export function NewslettersTable({ search, filter }: Props) {
  const [data, setData] = useState<NewsletterRow[]>(mockNewsletters);
  //const [data, setData] = useState<NewsletterRow[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [orderBy, setOrderBy] = useState<keyof NewsletterRow>('updated_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (property: keyof NewsletterRow) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  const getComparableValue = (value: unknown): string | number => {
    if (value === null || value === undefined) return '';

    // fecha
    const date = new Date(value as string);
    if (!isNaN(date.getTime())) return date.getTime();

    if (typeof value === 'number') return value;

    return value.toString().toLowerCase();
  };

  // Cargar datos desde backend (reemplazar con llamada real cuando esté disponible)
 /* useEffect(() => {
  const loadNewsletters = async () => {
    try {
      const newsletters = await getAllNewsletters();

      const rows: NewsletterRow[] = newsletters.map((n) => ({
        id: n.id,
        title: n.blocks?.[0]?.text || 'Sin título',
        autor: n.creatorUserId,
        state: n.state,
        language: 'Spanish',
        reviewer: '—',
        publish_date: null,
        updated_at: new Date(n.updatedAt).toLocaleDateString(),
      }));

      setData(rows);
    } catch (error) {
      console.error('Error cargando newsletters:', error);
    }
  };

  void loadNewsletters();
}, []);*/

  // FILTRO CENTRALIZADO
  const filteredData = useMemo(() => {
    return data
      .filter(item =>
        Object.entries(item).some(([key, value]) => {
          const searchableValue =
            key === 'state' && value
              ? NewsletterStatusLabel[value as NewsletterStatus]
              : value;

          return searchableValue?.toString().toLowerCase().includes(search.toLowerCase());
        })
      )
      .filter(item =>
        filter === 'ALL' ? true : pendingStatuses.has(item.state)
      )
      .sort((a, b) => {
        const aValue = getComparableValue(a[orderBy]);
        const bValue = getComparableValue(b[orderBy]);

        if (aValue === bValue) return 0;

        return (aValue < bValue ? -1 : 1) * (order === 'asc' ? 1 : -1);
      });
  }, [data, search, filter, order, orderBy]);

  const visibleData = filteredData.slice(0, visibleCount);

  return (
    <Paper sx={{ p: 2 }}>
      <TableContainer>
        <MuiTable>
          <TableHead>
            <TableRow>
              <TableCell sortDirection={orderBy === "title" ? order : false}>
                <TableSortLabel
                  active={orderBy === "title"}
                  direction={orderBy === "title" ? order : "asc"}
                  onClick={() => handleSort("title")}
                >
                  Título
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={orderBy === "autor" ? order : false}>
                <TableSortLabel
                  active={orderBy === "autor"}
                  direction={orderBy === "autor" ? order : "asc"}
                  onClick={() => handleSort("autor")}
                >
                  Autor
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={orderBy === "language" ? order : false}>
                <TableSortLabel
                  active={orderBy === "language"}
                  direction={orderBy === "language" ? order : "asc"}
                  onClick={() => handleSort("language")}
                >
                  Idioma
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={orderBy === "reviewer" ? order : false}>
                <TableSortLabel
                  active={orderBy === "reviewer"}
                  direction={orderBy === "reviewer" ? order : "asc"}
                  onClick={() => handleSort("reviewer")}
                >
                  Revisado por
                </TableSortLabel>
              </TableCell>

              <TableCell
                sortDirection={orderBy === "publish_date" ? order : false}
              >
                <TableSortLabel
                  active={orderBy === "publish_date"}
                  direction={orderBy === "publish_date" ? order : "asc"}
                  onClick={() => handleSort("publish_date")}
                >
                  Publicación
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={orderBy === "state" ? order : false}>
                <TableSortLabel
                  active={orderBy === "state"}
                  direction={orderBy === "state" ? order : "asc"}
                  onClick={() => handleSort("state")}
                >
                  Estado
                </TableSortLabel>
              </TableCell>

              <TableCell
                sortDirection={orderBy === "updated_at" ? order : false}
              >
                <TableSortLabel
                  active={orderBy === "updated_at"}
                  direction={orderBy === "updated_at" ? order : "asc"}
                  onClick={() => handleSort("updated_at")}
                >
                  Actualización
                </TableSortLabel>
              </TableCell>

              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleData.map((n) => (
              <TableRow key={n.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1.5}>
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>
                        {n.title}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>

                <TableCell>{n.autor}</TableCell>
                <TableCell>{n.language}</TableCell>
                <TableCell>{n.reviewer}</TableCell>

                <TableCell>{n.publish_date ?? "—"}</TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    label={NewsletterStatusLabel[n.state]}
                    color={getStatusColor(n.state)}
                  />
                </TableCell>

                <TableCell>{n.updated_at}</TableCell>

                <TableCell align="right">
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ justifyContent: "flex-end" }}
                  >
                    <Tooltip title="Vista Previa" arrow>
                      <IconButton>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar" arrow>
                      <IconButton size="small" onClick={() => navigate(`/editarNewsletter/${n.id}`)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar" arrow>
                      <IconButton onClick={() => setDeleteId(n.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </MuiTable>
      </TableContainer>

      {/* Cargar más */}
      {visibleCount < filteredData.length && (
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button onClick={() => setVisibleCount((v) => v + 5)}>
            Cargar más
          </Button>
        </Box>
      )}

      {/* Modal delete */}
      <ModalDelete
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          setData((prev) => prev.filter((n) => n.id !== deleteId));
          setDeleteId(null);
        }}
      />
    </Paper>
  );
}
