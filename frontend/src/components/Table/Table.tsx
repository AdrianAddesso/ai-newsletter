import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import IosShareIcon from '@mui/icons-material/IosShare'
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  NewsletterStatus,
  NewsletterStatusLabel,
} from '@shared/enums/newsletter-status.enum';
import { ModalDelete } from '../ModalDelete';
import { TableSortLabel } from '@mui/material';
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from 'react-router';
import { deleteNewsletter, getAllNewsletters, duplicateNewsletter } from '../../api/newsletters';
import { NewsletterPreviewModal } from '../../pages/newsletter/viewer/NewsletterPreviewModal'
import { useAuth } from '../../contexts/AuthContext'

interface NewsletterRow {
  id: string;
  title: string;
  autor: string;
  creatorUserId: string;
  state: NewsletterStatus;
  language: string;
  reviewer: string;
  publish_date: string | null;
  updated_at: string;
}

interface Props {
  search: string;
  filter: 'ALL' | 'PENDING';
  userRole: string;
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


export function NewslettersTable({ search, filter, userRole, }: Props) {
  const [data, setData] = useState<NewsletterRow[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const [orderBy, setOrderBy] = useState<keyof NewsletterRow>('updated_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewNewsletterId, setPreviewNewsletterId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [duplicateTitle, setDuplicateTitle] = useState('')
  const [duplicateNewsletterForDialog, setDuplicateNewsletterForDialog] = useState<string | null>(null)
  const { user } = useAuth()

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

  const handlePreview = (id: string) => {
    setPreviewNewsletterId(id)
    setPreviewOpen(true)
  }

  const handleDelete = async (): Promise<void> => {
    if (!deleteId) {
      return
    }

    try {
      setIsDeleting(true)
      await deleteNewsletter(deleteId)
      setData((prev) => prev.filter((newsletter) => newsletter.id !== deleteId))
      setDeleteId(null)
    } catch (error) {
      console.error('Error deleting newsletter:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDuplicate = async (id: string): Promise<void> => {
    try {
      setDuplicatingId(id)
      const newNewsletter = await duplicateNewsletter(id, duplicateTitle)
      navigate(`/editarNewsletter/${newNewsletter.id}`)
      setShowDuplicateDialog(false)
      setDuplicateTitle('')
    } catch (error) {
      console.error('Error duplicating newsletter:', error)
    } finally {
      setDuplicatingId(null)
    }
  }

  const handleOpenDuplicateDialog = (id: string, title: string) => {
    setDuplicateNewsletterForDialog(id)
    setDuplicateTitle(title)
    setShowDuplicateDialog(true)
  }

  const handleCloseDuplicateDialog = () => {
    setShowDuplicateDialog(false)
    setDuplicateTitle('')
    setDuplicateNewsletterForDialog(null)
  }

  useEffect(() => {
    const loadNewsletters = async () => {
      try {
        const newsletters = await getAllNewsletters();
        const rows: NewsletterRow[] = newsletters.map((n) => ({
          id: n.id,
          title: n.title || 'Sin título',
          autor: n.authorName || n.creatorUserId,
          creatorUserId: n.creatorUserId,
          state: n.state as NewsletterStatus,
          language: n.language,
          reviewer: '—',
          publish_date: n.publishDate ? new Date(n.publishDate).toLocaleDateString() : null,
          updated_at: new Date(n.updatedAt).toLocaleDateString(),
        }));
        setData(rows);
      } catch (error) {
        console.error('Error cargando newsletters:', error);
      }
    };
    void loadNewsletters();
  }, []);

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

  const editableStatuses = new Set<NewsletterStatus>([
    NewsletterStatus.DRAFT,
    NewsletterStatus.CHANGES_REQUESTED,
  ])

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
            {visibleData.map((n) => {
              const isPrivilegedUser =
                userRole === "ADMIN" || userRole === "FUNCTIONAL";
              const isOwner = user?.id === n.creatorUserId;

              const canEditByState = editableStatuses.has(n.state);
              const canEdit = canEditByState && (isPrivilegedUser || isOwner);

              const canDelete = isPrivilegedUser;

              const canExport = n.state === NewsletterStatus.APPROVED;

              const editTooltip = !canEditByState
                ? "Solo se puede editar borradores o newsletters con cambios solicitados"
                : !isPrivilegedUser && !isOwner
                  ? "Solo podes editar newsletters propios"
                  : "Editar";

              return (
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
                      {canExport && (
                        <Tooltip title="Exportar" arrow>
                          <IconButton
                            size="small"
                            onClick={() =>
                              navigate(`/exportarNewsletter/${n.id}`)
                            }
                          >
                            <IosShareIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                      {canExport && (
                        <Tooltip title="Crear nueva edición" arrow>
                          <IconButton
                            size="small"
                            disabled={duplicatingId === n.id}
                            onClick={() =>
                              handleOpenDuplicateDialog(n.id, n.title)
                            }
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="Vista previa" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handlePreview(n.id)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>

                      {canEdit && (
                        <Tooltip title={editTooltip} arrow>
                          <span>
                            <IconButton
                              size="small"
                              disabled={!canEdit}
                              onClick={() =>
                                navigate(`/editarNewsletter/${n.id}`)
                              }
                            >
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}

                      {canDelete && (
                        <Tooltip title="Eliminar" arrow>
                          <IconButton onClick={() => setDeleteId(n.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
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
        title="¿Confirmar eliminación?"
        description="Esta acción ocultará el newsletter de la lista activa."
        onConfirm={() => void handleDelete()}
        loading={isDeleting}
      />

      {/* Modal preview */}
      <NewsletterPreviewModal
        open={previewOpen}
        newsletterId={previewNewsletterId}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewNewsletterId(null);
        }}
      />

      <Dialog
        open={showDuplicateDialog}
        onClose={handleCloseDuplicateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crear nueva edición</DialogTitle>
            <DialogContent sx={{ px: 4 }}>
            <Box sx={{ pt: 1 }}>
                <TextField
                fullWidth
                label="Nombre del newsletter"
                value={duplicateTitle}
                onChange={(e) => setDuplicateTitle(e.target.value)}
                placeholder="Ingresa el nombre para la nueva edición"
                disabled={duplicatingId !== null}
                autoFocus
                margin="dense"
                slotProps={{
                    inputLabel: {
                    shrink: true,
                    },
                }}
                />
            </Box>
            </DialogContent>
            <DialogActions>
            <Button
                onClick={handleCloseDuplicateDialog}
                disabled={duplicatingId !== null}
            >
                Cancelar
            </Button>
            <Button
                onClick={() =>
                duplicateNewsletterForDialog &&
                void handleDuplicate(duplicateNewsletterForDialog)
                }
                variant="contained"
                disabled={duplicatingId !== null || !duplicateTitle.trim()}
            >
                {duplicatingId !== null ? (
                <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Duplicando...
                </>
                ) : (
                "Crear"
                )}
            </Button>
            </DialogActions>
        </Dialog>
    </Paper>
  );
}
