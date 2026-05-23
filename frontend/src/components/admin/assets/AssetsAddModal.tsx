import { useRef, useState, type DragEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import type { AssetType, UploadedAsset } from "../../../api/assets";

type EditableAssetType = Exclude<AssetType, "BLOCK">;

const ASSET_TYPE_LABELS: Record<EditableAssetType, string> = {
  IMAGE: "Imagen",
  ICON: "Icono",
  LOGO: "Logo",
  SHAPE: "Forma",
  LOCKUP: "Lockup",
  KEYWORD: "Keyword",
};

export type AssetModalPayload =
  | {
      mode: "create";
      files: File[];
      name: string;
      type: EditableAssetType;
    }
  | {
      mode: "update";
      name: string;
      type: EditableAssetType;
    };

interface AssetsAddModalProps {
  open: boolean;
  asset?: UploadedAsset | null;
  onClose: () => void;
  onConfirm: (data: AssetModalPayload) => Promise<void> | void;
}

export function AssetsAddModal({
  open,
  asset,
  onClose,
  onConfirm,
}: AssetsAddModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(asset?.name ?? "");
  const [type, setType] = useState<EditableAssetType>(
    asset?.type === "BLOCK" || !asset?.type ? "IMAGE" : asset.type,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const isEditing = Boolean(asset);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!name.trim()) {
      const parts = file.name.split(".");
      if (parts.length > 1) {
        parts.pop();
      }
      setName(parts.join(".") || file.name);
    }
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();

    if (isEditing) {
      onConfirm({
        mode: "update",
        name: trimmedName,
        type,
      });
      return;
    }

    if (!selectedFile) return;

    onConfirm({
      mode: "create",
      files: [selectedFile],
      name: trimmedName,
      type,
    });
  };

  const isValid = name.trim() !== "" && (isEditing || selectedFile !== null);

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? "Editar asset" : "Nuevo asset"}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {!isEditing && (
            <Box
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: "2px dashed",
                borderColor: dragOver ? "primary.main" : "divider",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
                cursor: "pointer",
                bgcolor: dragOver ? "action.hover" : "background.paper",
                transition: "all 0.2s",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <UploadFileIcon
                sx={{ fontSize: 36, color: "text.secondary", mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {selectedFile
                  ? selectedFile.name
                  : "Arrastra un archivo o haz clic para seleccionar"}
              </Typography>
              {selectedFile && (
                <Chip
                  size="small"
                  label={formatBytes(selectedFile.size)}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          )}

          {isEditing && (
            <Alert severity="info" sx={{ py: 0.5 }}>
              Estas editando los metadatos del asset. Para reemplazar el
              archivo, elimina este asset y carga uno nuevo.
            </Alert>
          )}

          <TextField
            label="Nombre"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
            size="small"
            required
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={type}
              label="Tipo"
              onChange={(event: SelectChangeEvent) =>
                setType(event.target.value as EditableAssetType)
              }
            >
              {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
          {isEditing ? "Guardar cambios" : "Agregar asset"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
