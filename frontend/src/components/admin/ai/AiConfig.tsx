import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
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
import { ModalDelete } from "../../ModalDelete";
import SearchBar from "../../SearchBar";
import { AiConfigModal } from "./AiConfigAddModal";
import {
  getAiConfigs,
  deleteAiConfig,
  type AiConfig,
  type CreateAiConfigRequest,
  type UpdateAiConfigRequest,
} from "../../../api/ai";

type SortKey = keyof Pick<AiConfig, "name" | "type" | "created_at">;

const TYPE_LABEL: Record<string, string> = {
    CREATE: "Generación",
    REGENERATE: "Mejora de texto",
};

export function AiConfig() {
    const [configs, setConfigs] = useState<AiConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [orderBy, setOrderBy] = useState<SortKey>("name");
    const [order, setOrder] = useState<"asc" | "desc">("asc");
    const [limit, setLimit] = useState(5);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<AiConfig | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchConfigs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
        setConfigs(await getAiConfigs());
        } catch {
        setError("No se pudieron cargar las configuraciones de IA.");
        } finally {
        setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchConfigs();
    }, [fetchConfigs]);

    const filtered = useMemo(() => {
        return [...configs]
        .filter((c) =>
            [c.name, c.type, TYPE_LABEL[c.type] ?? ""].some((v) =>
            v.toLowerCase().includes(search.toLowerCase()),
            ),
        )
        .sort((a, b) => {
            const av = String(a[orderBy] ?? "");
            const bv = String(b[orderBy] ?? "");
            if (av === bv) return 0;
            return (av < bv ? -1 : 1) * (order === "asc" ? 1 : -1);
        });
    }, [configs, search, order, orderBy]);

    const handleSort = (property: SortKey) => {
        setOrder(orderBy === property && order === "asc" ? "desc" : "asc");
        setOrderBy(property);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setEditTarget(null);
    };

    const handleConfirm = (saved: AiConfig) => {
        setConfigs((prev) => {
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
        await deleteAiConfig(deleteId);
        setConfigs((prev) => prev.filter((c) => c.id !== deleteId));
        } catch {
        setError("No se pudo eliminar la configuración.");
        } finally {
        setDeleting(false);
        setDeleteId(null);
        }
    };

    return (
        <Stack spacing={3}>
        {/* Header */}
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            }}
        >
            <Stack spacing={0.5}>
            <Typography variant="h6">Configuración de IA</Typography>
            <Typography variant="body2" color="text.secondary">
                Gestioná los parámetros de generación utilizados por el modelo.
            </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <SearchBar value={search} onChange={setSearch} />
            <Tooltip title="Actualizar lista">
                <IconButton size="small" onClick={fetchConfigs} disabled={loading}>
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
                Nueva configuración
            </Button>
            </Stack>
        </Stack>

        {/* Error */}
        {error && (
            <Alert severity="error" onClose={() => setError(null)}>
            {error}
            </Alert>
        )}

        {/* Loading */}
        {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={32} />
            </Box>
        ) : filtered.length === 0 ? (
            <Alert severity="info">
            No hay configuraciones que coincidan con la búsqueda.
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
                        Tipo
                    </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">Temperatura</TableCell>
                    <TableCell align="right">Top P</TableCell>
                    <TableCell align="right">Top K</TableCell>
                    <TableCell align="right">Máx. tokens</TableCell>
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
                {filtered.slice(0, limit).map((config) => (
                    <TableRow key={config.id} hover>
                    <TableCell>
                        <Typography variant="body2">
                        {config.name}
                        </Typography>
                    </TableCell>
                    <TableCell>
                        <Chip
                        label={TYPE_LABEL[config.type] ?? config.type}
                        size="small"
                        variant="outlined"
                        color={config.type === "CREATE" ? "primary" : "secondary"}
                        />
                    </TableCell>
                    <TableCell align="right">{config.temperature}</TableCell>
                    <TableCell align="right">{config.top_p}</TableCell>
                    <TableCell align="right">{config.top_k}</TableCell>
                    <TableCell align="right">
                        {config.max_output_tokens}
                    </TableCell>
                    <TableCell>
                        {new Date(config.created_at).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell align="right">
                        <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ justifyContent: "flex-end" }}
                        >
                        <Tooltip title="Editar">
                            <IconButton
                            size="small"
                            onClick={() => {
                                setEditTarget(config);
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
                            onClick={() => setDeleteId(config.id)}
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
                <Button onClick={() => setLimit((c) => c + 5)}>
                    Cargar más resultados
                </Button>
                </Box>
            )}
            </TableContainer>
        )}

        {/* Modals */}
        <AiConfigModal
            open={modalOpen}
            config={editTarget}
            onClose={handleModalClose}
            onConfirm={handleConfirm}
        />

        <ModalDelete
            open={Boolean(deleteId)}
            description="Esta acción eliminará la configuración de IA de forma permanente."
            onClose={() => setDeleteId(null)}
            onConfirm={handleDelete}
            loading={deleting}
        />
        </Stack>
    );
}
