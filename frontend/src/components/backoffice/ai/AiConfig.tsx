import { useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    Chip,
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
import { AiConfigAddModal } from "./AiConfigAddModal";
import type { AiAttribute } from "./AiConfigAddModal";

// ---------------------------------------------------------------------------
// Mock data — replace with real API calls once the endpoint is available
// ---------------------------------------------------------------------------
const INITIAL_ATTRIBUTES: AiAttribute[] = [
    {
        id: "1",
        key: "prompt_base",
        value:
        "Eres un asistente experto en comunicación corporativa. Redactá contenido claro, conciso y profesional.",
        description: "Prompt base para la generación de newsletters",
        created_at: "2024-01-10",
    },
    {
        id: "2",
        key: "tone",
        value: "formal",
        description: "Tono de escritura predeterminado",
        created_at: "2024-01-11",
    },
    {
        id: "3",
        key: "language",
        value: "es",
        description: "Idioma de generación de contenido",
        created_at: "2024-01-12",
    },
    {
        id: "4",
        key: "max_tokens",
        value: "2048",
        description: "Límite de tokens por generación",
        created_at: "2024-01-13",
    },
    ];

    export function AiConfig() {
    const [attributes, setAttributes] =
        useState<AiAttribute[]>(INITIAL_ATTRIBUTES);
    const [search, setSearch] = useState("");
    const [orderBy, setOrderBy] = useState<keyof AiAttribute>("key");
    const [order, setOrder] = useState<"asc" | "desc">("asc");
    const [limit, setLimit] = useState(5);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<AiAttribute | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        return [...attributes]
        .filter((a) =>
            [a.key, a.value, a.description ?? ""].some((v) =>
            v.toLowerCase().includes(search.toLowerCase()),
            ),
        )
        .sort((a, b) => {
            const av = String(a[orderBy] ?? "");
            const bv = String(b[orderBy] ?? "");
            if (av === bv) return 0;
            return (av < bv ? -1 : 1) * (order === "asc" ? 1 : -1);
        });
    }, [attributes, search, order, orderBy]);

    const handleSort = (property: keyof AiAttribute) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    const openAdd = () => {
        setEditTarget(null);
        setModalOpen(true);
    };

    const openEdit = (attr: AiAttribute) => {
        setEditTarget(attr);
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setEditTarget(null);
    };

    const handleConfirm = (data: Omit<AiAttribute, "id" | "created_at">) => {
        if (editTarget) {
        setAttributes((prev) =>
            prev.map((a) => (a.id === editTarget.id ? { ...a, ...data } : a)),
        );
        } else {
        const newAttr: AiAttribute = {
            ...data,
            id: String(Date.now()),
            created_at: new Date().toISOString().split("T")[0],
        };
        setAttributes((prev) => [newAttr, ...prev]);
        }
        handleModalClose();
    };

    const handleDelete = () => {
        setAttributes((prev) => prev.filter((a) => a.id !== deleteId));
        setDeleteId(null);
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
            <Typography variant="h6">
                Configuración de IA
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Gestioná los atributos y prompts utilizados en la generación de
                contenido.
            </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <SearchBar value={search} onChange={setSearch} />
            <Tooltip title="Actualizar lista">
                <IconButton
                size="small"
                onClick={() => setAttributes(INITIAL_ATTRIBUTES)}
                >
                <RefreshIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={openAdd}
                sx={{ whiteSpace: "nowrap" }}
            >
                Nuevo Atributo
            </Button>
            </Stack>
        </Stack>

        {/* Table */}
        {filtered.length === 0 ? (
            <Alert severity="info">
            No hay atributos que coincidan con la búsqueda.
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
                        active={orderBy === "key"}
                        direction={orderBy === "key" ? order : "asc"}
                        onClick={() => handleSort("key")}
                    >
                        Clave
                    </TableSortLabel>
                    </TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell>Descripción</TableCell>
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
                {filtered.slice(0, limit).map((attr) => (
                    <TableRow key={attr.id} hover>
                    <TableCell>
                        <Chip label={attr.key} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                        <Typography
                        variant="body2"
                        noWrap
                        sx={{ maxWidth: 300, display: "block" }}
                        >
                        {attr.value}
                        </Typography>
                    </TableCell>
                    <TableCell>
                        <Typography variant="caption" color="text.secondary">
                        {attr.description ?? "—"}
                        </Typography>
                    </TableCell>
                    <TableCell>{attr.created_at}</TableCell>
                    <TableCell align="right">
                        <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ justifyContent: "flex-end" }}
                        >
                        <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => openEdit(attr)}>
                            <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Borrar">
                            <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteId(attr.id)}
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
        <AiConfigAddModal
            open={modalOpen}
            attribute={editTarget}
            onClose={handleModalClose}
            onConfirm={handleConfirm}
        />

        <ModalDelete
            open={Boolean(deleteId)}
            description="Esta acción eliminará el atributo de forma permanente."
            onClose={() => setDeleteId(null)}
            onConfirm={handleDelete}
        />
        </Stack>
    );
}
