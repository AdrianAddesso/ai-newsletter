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
import { useNavigate } from "react-router";
import { ModalDelete } from "../../ModalDelete";
import SearchBar from "../../SearchBar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Brandkit {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  font_group_id?: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const INITIAL_BRANDKITS: Brandkit[] = [
  {
    id: "1",
    name: "Comunicación Interna 2024",
    active: true,
    created_at: "2024-01-05",
    updated_at: "2024-03-10",
  },
  {
    id: "2",
    name: "Comunicación Corporativa Global",
    active: false,
    created_at: "2024-02-12",
    updated_at: "2024-02-28",
  },
  {
    id: "3",
    name: "Campaña Verano 2024",
    active: false,
    created_at: "2024-03-01",
    updated_at: "2024-03-20",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function BrandkitList() {
    const navigate = useNavigate();

    const [brandkits, setBrandkits] = useState<Brandkit[]>(INITIAL_BRANDKITS);
    const [search, setSearch] = useState("");
    const [orderBy, setOrderBy] = useState<keyof Brandkit>("name");
    const [order, setOrder] = useState<"asc" | "desc">("asc");
    const [limit, setLimit] = useState(5);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        return [...brandkits]
        .filter((bk) =>
            [bk.name].some((v) => v.toLowerCase().includes(search.toLowerCase())),
        )
        .sort((a, b) => {
            const av = String(a[orderBy] ?? "");
            const bv = String(b[orderBy] ?? "");
            if (av === bv) return 0;
            return (av < bv ? -1 : 1) * (order === "asc" ? 1 : -1);
        });
    }, [brandkits, search, order, orderBy]);

    const handleSort = (property: keyof Brandkit) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    const handleDelete = () => {
        setBrandkits((prev) => prev.filter((bk) => bk.id !== deleteId));
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
                Brandkits
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Gestioná las identidades visuales disponibles para los newsletters.
            </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <SearchBar value={search} onChange={setSearch} />
            <Tooltip title="Actualizar lista">
                <IconButton
                size="small"
                onClick={() => setBrandkits(INITIAL_BRANDKITS)}
                >
                <RefreshIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => navigate("/backoffice/brandkit")}
                sx={{ whiteSpace: "nowrap" }}
            >
                Nuevo Brandkit
            </Button>
            </Stack>
        </Stack>

        {/* Table */}
        {filtered.length === 0 ? (
            <Alert severity="info">
            No hay brandkits que coincidan con la búsqueda.
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
                    <TableCell>Estado</TableCell>
                    <TableCell>
                    <TableSortLabel
                        active={orderBy === "created_at"}
                        direction={orderBy === "created_at" ? order : "asc"}
                        onClick={() => handleSort("created_at")}
                    >
                        Creado
                    </TableSortLabel>
                    </TableCell>
                    <TableCell>
                    <TableSortLabel
                        active={orderBy === "updated_at"}
                        direction={orderBy === "updated_at" ? order : "asc"}
                        onClick={() => handleSort("updated_at")}
                    >
                        Actualizado
                    </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">Acciones</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {filtered.slice(0, limit).map((bk) => (
                    <TableRow key={bk.id} hover>
                    <TableCell>
                        <Typography variant="subtitle2">{bk.name}</Typography>
                    </TableCell>
                    <TableCell>
                        <Chip
                        label={bk.active ? "Activo" : "Inactivo"}
                        size="small"
                        color={bk.active ? "success" : "default"}
                        />
                    </TableCell>
                    <TableCell>{bk.created_at}</TableCell>
                    <TableCell>{bk.updated_at}</TableCell>
                    <TableCell align="right">
                        <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ justifyContent: "flex-end" }}
                        >
                        <Tooltip title="Editar">
                            <IconButton
                            size="small"
                            onClick={() =>
                                navigate(`/backoffice/brandkit?id=${bk.id}`)
                            }
                            >
                            <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Borrar">
                            <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteId(bk.id)}
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

        <ModalDelete
            open={Boolean(deleteId)}
            description="Esta acción eliminará el brandkit de forma permanente. Los assets y colores asociados no serán eliminados."
            onClose={() => setDeleteId(null)}
            onConfirm={handleDelete}
        />
        </Stack>
    );
}
