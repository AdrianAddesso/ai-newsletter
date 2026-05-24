import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Divider,
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
} from "@mui/material";
import {
    Add as AddIcon,
    DeleteOutlined as DeleteIcon,
    EditOutlined as EditIcon,
    Refresh as RefreshIcon,
} from "@mui/icons-material";
import { AiConfigTypeLabel } from "@shared/enums/ai-config-type.enum";
import { ModalDelete } from "../../ModalDelete";
import SearchBar from "../../SearchBar";
import { AiConfigEditModal } from "./AiConfigEditModal";
import { PromptCommandModal } from "./PromptCommandModal";
import {
    getAiConfigs,
    getPromptCommands,
    deletePromptCommand,
    type AiConfig,
    type PromptCommand,
} from "../../../api/ai";

type PromptSortKey = keyof Pick<
    PromptCommand,
    "name" | "type" | "display_order" | "created_at"
>;

// ─── Section 1: AI Config ─────────────────────────────────────────────────────

function AiConfigSection() {
    const [configs, setConfigs] = useState<AiConfig[]>([]);
    const [loadingAll, setLoadingAll] = useState(true);
    const [refreshingId, setRefreshingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [editTarget, setEditTarget] = useState<AiConfig | null>(null);

    const fetchAll = useCallback(async () => {
        setLoadingAll(true);
        setError(null);
        try {
        setConfigs(await getAiConfigs());
        } catch {
        setError("No se pudieron cargar las configuraciones de IA.");
        } finally {
        setLoadingAll(false);
        }
    }, []);

    useEffect(() => {
        void fetchAll();
    }, [fetchAll]);

    const handleRowRefresh = async (id: string) => {
        setRefreshingId(id);
        try {
        const updated = await getAiConfigs();
        setConfigs((prev) =>
            prev.map((c) => updated.find((u) => u.id === c.id) ?? c),
        );
        } catch {
        setError("No se pudo actualizar la fila.");
        } finally {
        setRefreshingId(null);
        }
    };

    const handleEditConfirm = (saved: AiConfig) => {
        setConfigs((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
        setEditTarget(null);
    };

    return (
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h6">Configuración de IA</Typography>
          <Typography variant="body2" color="text.secondary">
            Parámetros de generación por tipo de operación.
          </Typography>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loadingAll ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <TableContainer
            component={Card}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            <Table>
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Uso</TableCell>
                  <TableCell align="right">Temperatura</TableCell>
                  <TableCell align="right">Top P</TableCell>
                  <TableCell align="right">Top K</TableCell>
                  <TableCell align="right">Máx. tokens</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id} hover>
                    <TableCell>
                      <Typography variant="body2">{config.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={AiConfigTypeLabel[config.type]}
                        size="small"
                        variant="outlined"
                        color={
                          config.type === "CREATE" ? "primary" : "secondary"
                        }
                      />
                    </TableCell>
                    <TableCell align="right">{config.temperature}</TableCell>
                    <TableCell align="right">{config.top_p}</TableCell>
                    <TableCell align="right">{config.top_k}</TableCell>
                    <TableCell align="right">
                      {config.max_output_tokens}
                    </TableCell>
                    <TableCell align="right">
                        <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{ alignItems: "center" }}
                        >
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => setEditTarget(config)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Actualizar">
                          <IconButton
                            size="small"
                            onClick={() => handleRowRefresh(config.id)}
                            disabled={refreshingId === config.id}
                          >
                            {refreshingId === config.id ? (
                              <CircularProgress size={14} />
                            ) : (
                              <RefreshIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <AiConfigEditModal
          open={Boolean(editTarget)}
          config={editTarget}
          onClose={() => setEditTarget(null)}
          onConfirm={handleEditConfirm}
        />
      </Stack>
    );
}

// ─── Section 2: Prompt Commands ───────────────────────────────────────────────

function PromptCommandsSection() {
    const [commands, setCommands] = useState<PromptCommand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [orderBy, setOrderBy] = useState<PromptSortKey>("display_order");
    const [order, setOrder] = useState<"asc" | "desc">("asc");
    const [limit, setLimit] = useState(10);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<PromptCommand | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchCommands = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
        setCommands(await getPromptCommands());
        } catch {
        setError("No se pudieron cargar las instrucciones de prompt.");
        } finally {
        setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchCommands();
    }, [fetchCommands]);

    const filtered = useMemo(() => {
        return [...commands]
        .filter((c) =>
            [c.name, c.type, c.instruction ?? ""].some((v) =>
            v.toLowerCase().includes(search.toLowerCase()),
            ),
        )
        .sort((a, b) => {
            const av = String(a[orderBy] ?? "");
            const bv = String(b[orderBy] ?? "");
            if (av === bv) return 0;
            return (av < bv ? -1 : 1) * (order === "asc" ? 1 : -1);
        });
    }, [commands, search, order, orderBy]);

    const handleSort = (property: PromptSortKey) => {
        setOrder(orderBy === property && order === "asc" ? "desc" : "asc");
        setOrderBy(property);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setEditTarget(null);
    };

    const handleConfirm = (saved: PromptCommand) => {
        setCommands((prev) => {
        const exists = prev.find((c) => c.id === saved.id);
        return exists
            ? prev.map((c) => (c.id === saved.id ? saved : c))
            : [saved, ...prev];
        });
        handleModalClose();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
        await deletePromptCommand(deleteId);
        setCommands((prev) => prev.filter((c) => c.id !== deleteId));
        } catch {
        setError("No se pudo eliminar la instrucción.");
        } finally {
        setDeleting(false);
        setDeleteId(null);
        }
    };

    return (
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
          }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h6">Configuración de Prompts</Typography>
            <Typography variant="body2" color="text.secondary">
              Instrucciones enviadas al modelo para cada tipo de operación.
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <SearchBar value={search} onChange={setSearch} />
            <Tooltip title="Actualizar lista">
              <IconButton
                size="small"
                onClick={fetchCommands}
                disabled={loading}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditTarget(null);
                setModalOpen(true);
              }}
              sx={{ whiteSpace: "nowrap" }}
            >
              Nueva instrucción
            </Button>
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : filtered.length === 0 ? (
          <Alert severity="info">
            No hay instrucciones que coincidan con la búsqueda.
          </Alert>
        ) : (
          <TableContainer
            component={Card}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            <Table>
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "name"}
                      direction={orderBy === "name" ? order : "asc"}
                      onClick={() => handleSort("name")}
                    >
                      Nombre
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "type"}
                      direction={orderBy === "type" ? order : "asc"}
                      onClick={() => handleSort("type")}
                    >
                      Uso
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "display_order"}
                      direction={orderBy === "display_order" ? order : "asc"}
                      onClick={() => handleSort("display_order")}
                    >
                      Orden
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Instrucción</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "created_at"}
                      direction={orderBy === "created_at" ? order : "asc"}
                      onClick={() => handleSort("created_at")}
                    >
                      Creado
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.slice(0, limit).map((cmd) => (
                  <TableRow key={cmd.id} hover>
                    <TableCell>
                      <Typography variant="body2">{cmd.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={AiConfigTypeLabel[cmd.type]}
                        size="small"
                        variant="outlined"
                        color={cmd.type === "CREATE" ? "primary" : "secondary"}
                      />
                    </TableCell>
                    <TableCell>{cmd.display_order}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ maxWidth: 320, display: "block" }}
                      >
                        {cmd.instruction ?? "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(cmd.created_at).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ alignItems: "center" }}
                      >
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditTarget(cmd);
                              setModalOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Borrar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteId(cmd.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {limit < filtered.length && (
              <Box
                sx={{
                  p: 2,
                  textAlign: "center",
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Button onClick={() => setLimit((c) => c + 10)}>
                  Cargar más resultados
                </Button>
              </Box>
            )}
          </TableContainer>
        )}

        <PromptCommandModal
          open={modalOpen}
          command={editTarget}
          onClose={handleModalClose}
          onConfirm={handleConfirm}
        />

        <ModalDelete
          open={Boolean(deleteId)}
          description="Esta acción eliminará la instrucción de prompt de forma permanente."
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      </Stack>
    );
}


export function AiConfig() {
    return (
        <Stack spacing={4}>
        <AiConfigSection />
        <Divider />
        <PromptCommandsSection />
        </Stack>
    );
}
