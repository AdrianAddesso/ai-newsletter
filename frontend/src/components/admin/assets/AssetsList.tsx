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
import {
  deleteAsset,
  listAssets,
  updateAsset,
  uploadAssets,
} from "../../../api/assets";
import type { AssetType, UploadedAsset } from "../../../api/assets";
import { AssetsAddModal, type AssetModalPayload } from "./AssetsAddModal";

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  IMAGE: "Imagen",
  ICON: "Icono",
  LOGO: "Logo",
  SHAPE: "Forma",
  LOCKUP: "Lockup",
  KEYWORD: "Keyword",
  BLOCK: "Bloque",
};

const TYPE_COLORS: Record<
  AssetType,
  "default" | "primary" | "secondary" | "info" | "warning"
> = {
  IMAGE: "primary",
  ICON: "secondary",
  LOGO: "info",
  SHAPE: "warning",
  LOCKUP: "default",
  KEYWORD: "default",
  BLOCK: "default",
};

const formatAssetDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-UY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

interface AssetsListProps {
  brandId?: string;
  compact?: boolean;
}

export function AssetsList({ compact = false }: AssetsListProps) {
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [orderBy, setOrderBy] = useState<keyof UploadedAsset>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [limit, setLimit] = useState(5);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UploadedAsset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handleSort = (property: keyof UploadedAsset): void => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const fetchAssets = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listAssets();
      setAssets(response.assets);
    } catch (unknownError) {
      console.error("Error fetching assets:", unknownError);
      setError("No se pudieron obtener los assets.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchAssets();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchAssets]);

const filtered = useMemo(() => {
  const lowerSearch = search.toLowerCase();

  return [...assets]
    .filter((asset) => {

      const typeLabel = ASSET_TYPE_LABELS[asset.type] || asset.type;
      const createdAtLabel = asset.created_at
        ? formatAssetDate(asset.created_at)
        : "";
      const updatedAtLabel = asset.updated_at
        ? formatAssetDate(asset.updated_at)
        : "";

      return [
        asset.name,
        asset.url,
        asset.created_at,
        asset.updated_at,
        typeLabel,
        createdAtLabel,
        updatedAtLabel,
      ].some((value) => value?.toLowerCase().includes(lowerSearch));
    })
    .sort((left, right) => {
      let leftValue = left[orderBy];
      let rightValue = right[orderBy];

      if (orderBy === "type") {
        leftValue = ASSET_TYPE_LABELS[left.type] || left.type;
        rightValue = ASSET_TYPE_LABELS[right.type] || right.type;
      }


      const strLeft = String(leftValue ?? "").toLowerCase();
      const strRight = String(rightValue ?? "").toLowerCase();

      if (strLeft === strRight) return 0;
      return (strLeft < strRight ? -1 : 1) * (order === "asc" ? 1 : -1);
    });
}, [assets, search, order, orderBy]);

  const openAdd = (): void => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (asset: UploadedAsset): void => {
    setEditTarget(asset);
    setModalOpen(true);
  };

  const handleModalClose = (): void => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleConfirm = async (data: AssetModalPayload): Promise<void> => {
    setError(null);

    try {
      if (data.mode === "update" && editTarget) {
        await updateAsset(editTarget.id, {
          name: data.name,
          type: data.type,
        });
      }

      if (data.mode === "create") {
        const response = await uploadAssets(data.files, data.type);
        const uploadedAsset = response.assets[0];

        if (uploadedAsset && uploadedAsset.name !== data.name) {
          await updateAsset(uploadedAsset.id, {
            name: data.name,
            type: data.type,
          });
        }
      }

      await fetchAssets();
      handleModalClose();
    } catch (unknownError) {
      console.error("Error saving asset:", unknownError);
      setError("No se pudo guardar el asset.");
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteId) return;

    setError(null);

    try {
      await deleteAsset(deleteId);
      setAssets((currentAssets) =>
        currentAssets.filter((asset) => asset.id !== deleteId),
      );
      setDeleteId(null);
    } catch (unknownError) {
      console.error("Error deleting asset:", unknownError);
      setError("No se pudo eliminar el asset.");
    }
  };

  return (
    <Stack spacing={3}>
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
            <Typography variant="h6">Assets</Typography>
            <Typography variant="body2" color="text.secondary">
              Gestiona las imagenes y archivos disponibles.
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
            <IconButton
              size="small"
              onClick={() => void fetchAssets()}
              disabled={isLoading}
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
            Nuevo asset
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Alert severity="info">
          No se encontraron assets con esa busqueda.
        </Alert>
      ) : (
        <TableContainer
          component={Card}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          <Table sx={{ tableLayout: "fixed", minWidth: 880 }}>
                <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                    {/* ADDED: Fixed width for image column */}
                    <TableCell sx={{ width: 200 }}>Vista Previa</TableCell>

                    {/* Nombre column takes remaining space automatically */}
                    <TableCell>
                    <TableSortLabel
                        active={orderBy === "name"}
                        direction={orderBy === "name" ? order : "asc"}
                        onClick={() => handleSort("name")}
                    >
                        Nombre
                    </TableSortLabel>
                    </TableCell>

                    {/* ADDED: Sort para la columna Tipo */}
                    <TableCell sx={{ width: 120 }}>
                    <TableSortLabel
                        active={orderBy === "type"}
                        direction={orderBy === "type" ? order : "asc"}
                        onClick={() => handleSort("type")}
                    >
                        Tipo
                    </TableSortLabel>
                    </TableCell>

                    <TableCell sx={{ width: 180 }}>
                    <TableSortLabel
                        active={orderBy === "created_at"}
                        direction={orderBy === "created_at" ? order : "asc"}
                        onClick={() => handleSort("created_at")}
                    >
                        Creado
                    </TableSortLabel>
                    </TableCell>

                    <TableCell sx={{ width: 180 }}>
                    <TableSortLabel
                        active={orderBy === "updated_at"}
                        direction={orderBy === "updated_at" ? order : "asc"}
                        onClick={() => handleSort("updated_at")}
                    >
                        Actualizado
                    </TableSortLabel>
                    </TableCell>

                    <TableCell align="right" sx={{ width: 100 }}>
                    Acciones
                    </TableCell>
                </TableRow>
                </TableHead>
            <TableBody>
              {filtered.slice(0, limit).map((asset) => (
                <TableRow key={asset.id} hover>
                  <TableCell>
                    <Box
                      component="img"
                      src={asset.url}
                      alt={asset.name}
                      sx={{
                        maxHeight: 170,
                        maxWidth: 170,
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </TableCell>

                  <TableCell sx={{ wordBreak: "break-word" }}>
                    <Typography variant="subtitle2">{asset.name}</Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={ASSET_TYPE_LABELS[asset.type] || asset.type}
                      size="small"
                      color={TYPE_COLORS[asset.type] || "default"}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {formatAssetDate(asset.created_at)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {formatAssetDate(asset.updated_at)}
                    </Typography>
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
              <Button
                onClick={() => setLimit((currentLimit) => currentLimit + 5)}
              >
                Cargar mas resultados
              </Button>
            </Box>
          )}
        </TableContainer>
      )}

      {modalOpen && (
        <AssetsAddModal
          key={editTarget?.id ?? "new-asset"}
          open={modalOpen}
          asset={editTarget}
          onClose={handleModalClose}
          onConfirm={handleConfirm}
        />
      )}

      <ModalDelete
        open={Boolean(deleteId)}
        description="Esta accion eliminara el asset de la lista."
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  );
}
