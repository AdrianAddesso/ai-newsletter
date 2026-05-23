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
  Image as ImageIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { ModalDelete } from "../../ModalDelete";
import SearchBar from "../../SearchBar";
import { AssetsAddModal } from "./AssetsAddModal";
import type { Asset, AssetType } from "./AssetsAddModal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ASSET_TYPE_LABELS: Record<AssetType, string> = {
    IMAGE: "Imagen",
    DOCUMENT: "Documento",
    VIDEO: "Video",
    FONT: "Fuente",
    OTHER: "Otro",
};

const TYPE_COLORS: Record<
  AssetType,
  "default" | "primary" | "secondary" | "info" | "warning"
> = {
  IMAGE: "primary",
  DOCUMENT: "info",
  VIDEO: "secondary",
  FONT: "warning",
  OTHER: "default",
};

const formatBytes = (bytes?: number) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const INITIAL_ASSETS: Asset[] = [
  {
    id: "1",
    name: "Logo Nestle Principal",
    description: "Logo principal en fondo blanco",
    created_at: "2024-02-01",
    type: "IMAGE",
    bucket: "brand-assets",
    file_name: "nestle_logo_white.png",
    extension: "png",
    size_bytes: 45200,
    from_brand: true,
  },
  {
    id: "2",
    name: "Fuente NestleBrush",
    created_at: "2024-02-03",
    type: "FONT",
    bucket: "brand-assets",
    file_name: "NestleBrush.woff2",
    extension: "woff2",
    size_bytes: 120000,
    from_brand: true,
  },
  {
    id: "3",
    name: "Banner Q1 2024",
    description: "Banner campaña primer trimestre",
    created_at: "2024-03-10",
    type: "IMAGE",
    bucket: "campaign-assets",
    file_name: "banner_q1_2024.jpg",
    extension: "jpg",
    size_bytes: 980000,
    from_brand: false,
  },
  {
    id: "4",
    name: "Guia de Marca 2024",
    description: "Brand guidelines completas",
    created_at: "2024-01-20",
    type: "DOCUMENT",
    bucket: "brand-assets",
    file_name: "brand_guide_2024.pdf",
    extension: "pdf",
    size_bytes: 5200000,
    from_brand: true,
  },
];

// ---------------------------------------------------------------------------
// Component — accepts optional brandId to scope assets to a brandkit
// ---------------------------------------------------------------------------
interface AssetsListProps {
  /** When provided, the component acts as an asset selector inside BrandkitPage */
  brandId?: string;
  /** If true, hides the section header (useful when embedded in BrandkitPage) */
  compact?: boolean;
}

export function AssetsList({ compact = false }: AssetsListProps) {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [search, setSearch] = useState("");
  const [orderBy, setOrderBy] = useState<keyof Asset>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [limit, setLimit] = useState(5);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Asset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return [...assets]
      .filter((a) =>
        [a.name, a.description ?? "", a.type, a.file_name, a.bucket].some((v) =>
          v.toLowerCase().includes(search.toLowerCase()),
        ),
      )
      .sort((a, b) => {
        const av = String(a[orderBy] ?? "");
        const bv = String(b[orderBy] ?? "");
        if (av === bv) return 0;
        return (av < bv ? -1 : 1) * (order === "asc" ? 1 : -1);
      });
  }, [assets, search, order, orderBy]);

  const handleSort = (property: keyof Asset) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const openAdd = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (asset: Asset) => {
    setEditTarget(asset);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleConfirm = (data: Omit<Asset, "id" | "created_at">) => {
    if (editTarget) {
      setAssets((prev) =>
        prev.map((a) => (a.id === editTarget.id ? { ...a, ...data } : a)),
      );
    } else {
      const newAsset: Asset = {
        ...data,
        id: String(Date.now()),
        created_at: new Date().toISOString().split("T")[0],
      };
      setAssets((prev) => [newAsset, ...prev]);
    }
    handleModalClose();
  };

  const handleDelete = () => {
    setAssets((prev) => prev.filter((a) => a.id !== deleteId));
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
        {!compact && (
          <Stack spacing={0.5}>
            <Typography variant="h6">
              Assets
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestioná las imágenes y archivos disponibles para los newsletters.
            </Typography>
          </Stack>
        )}

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", ml: compact ? 0 : "auto" }}
        >
          <SearchBar value={search} onChange={setSearch} />
          <Tooltip title="Actualizar lista">
            <IconButton size="small" onClick={() => setAssets(INITIAL_ASSETS)}>
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
            Nuevo Asset
          </Button>
        </Stack>
      </Stack>

      {/* Table */}
      {filtered.length === 0 ? (
        <Alert severity="info">
          No se encontraron assets con esa búsqueda.
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
                <TableCell sx={{ width: 48 }} />
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "name"}
                    direction={orderBy === "name" ? order : "asc"}
                    onClick={() => handleSort("name")}
                  >
                    Nombre
                  </TableSortLabel>
                </TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Archivo</TableCell>
                <TableCell>Tamaño</TableCell>
                <TableCell>Brandkit</TableCell>
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
              {filtered.slice(0, limit).map((asset) => (
                <TableRow key={asset.id} hover>
                  {/* Icon column */}
                  <TableCell>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        bgcolor: "action.hover",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ImageIcon fontSize="small" color="action" />
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="subtitle2">{asset.name}</Typography>
                    {asset.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ maxWidth: 200, display: "block" }}
                      >
                        {asset.description}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={ASSET_TYPE_LABELS[asset.type]}
                      size="small"
                      color={TYPE_COLORS[asset.type]}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {asset.file_name}
                    </Typography>
                  </TableCell>

                  <TableCell>{formatBytes(asset.size_bytes)}</TableCell>

                  <TableCell>
                    {asset.from_brand ? (
                      <Chip label="Sí" size="small" color="success" />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>{asset.created_at}</TableCell>

                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ justifyContent: "flex-end" }}
                    >
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => openEdit(asset)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Borrar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteId(asset.id)}
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
      <AssetsAddModal
        open={modalOpen}
        asset={editTarget}
        onClose={handleModalClose}
        onConfirm={handleConfirm}
      />

      <ModalDelete
        open={Boolean(deleteId)}
        description="Esta acción eliminará el asset de forma permanente."
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  );
}
