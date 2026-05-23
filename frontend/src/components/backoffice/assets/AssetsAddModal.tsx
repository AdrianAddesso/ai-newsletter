import { useEffect, useRef, useState } from "react";
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
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";

export type AssetType = "IMAGE" | "DOCUMENT" | "VIDEO" | "FONT" | "OTHER";

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  IMAGE: "Imagen",
  DOCUMENT: "Documento",
  VIDEO: "Video",
  FONT: "Fuente",
  OTHER: "Otro",
};

export interface Asset {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    type: AssetType;
    bucket: string;
    file_name: string;
    extension?: string;
    size_bytes?: number;
    from_brand: boolean;
    created_by_user_id?: string;
    }

    interface AssetsAddModalProps {
    open: boolean;
    asset?: Asset | null;
    onClose: () => void;
    onConfirm: (data: Omit<Asset, "id" | "created_at">) => void;
    }

    export function AssetsAddModal({
    open,
    asset,
    onClose,
    onConfirm,
    }: AssetsAddModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<AssetType>("IMAGE");
    const [bucket, setBucket] = useState("assets");
    const [fileName, setFileName] = useState("");
    const [extension, setExtension] = useState("");
    const [sizeBytes, setSizeBytes] = useState<number | undefined>(undefined);
    const [fromBrand, setFromBrand] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const isEditing = Boolean(asset);

    useEffect(() => {
        if (open) {
        setName(asset?.name ?? "");
        setDescription(asset?.description ?? "");
        setType(asset?.type ?? "IMAGE");
        setBucket(asset?.bucket ?? "assets");
        setFileName(asset?.file_name ?? "");
        setExtension(asset?.extension ?? "");
        setSizeBytes(asset?.size_bytes);
        setFromBrand(asset?.from_brand ?? false);
        setSelectedFile(null);
        }
    }, [asset, open]);

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        const parts = file.name.split(".");
        const ext = parts.length > 1 ? parts.pop()! : "";
        setFileName(file.name);
        setExtension(ext);
        setSizeBytes(file.size);
        if (!name) setName(parts.join("."));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleSubmit = () => {
        onConfirm({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        bucket,
        file_name: fileName,
        extension: extension || undefined,
        size_bytes: sizeBytes,
        from_brand: fromBrand,
        });
    };

    const isValid = name.trim() !== "" && fileName !== "";

    const formatBytes = (bytes?: number) => {
        if (!bytes) return "—";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? "Editar asset" : "Nuevo asset"}</DialogTitle>

        <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
            {/* File drop zone — only on creation */}
            {!isEditing && (
                <Box
                onDragOver={(e) => {
                    e.preventDefault();
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
                    onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                    }}
                />
                <UploadFileIcon
                    sx={{ fontSize: 36, color: "text.secondary", mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                    {selectedFile
                    ? selectedFile.name
                    : "Arrastrá un archivo o hacé clic para seleccionar"}
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
                Estás editando los metadatos del asset. Para reemplazar el
                archivo, eliminá este asset y cargá uno nuevo.
                </Alert>
            )}

            <TextField
                label="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                size="small"
                required
            />

            <TextField
                label="Descripción (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                size="small"
            />

            <FormControl size="small" fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                value={type}
                label="Tipo"
                onChange={(e: SelectChangeEvent) =>
                    setType(e.target.value as AssetType)
                }
                >
                {Object.entries(ASSET_TYPE_LABELS).map(([val, label]) => (
                    <MenuItem key={val} value={val}>
                    {label}
                    </MenuItem>
                ))}
                </Select>
            </FormControl>

            <TextField
                label="Bucket"
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
                fullWidth
                size="small"
                required
            />

            {isEditing && (
                <Stack direction="row" spacing={2}>
                <TextField
                    label="Nombre de archivo"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    fullWidth
                    size="small"
                />
                <TextField
                    label="Extensión"
                    value={extension}
                    onChange={(e) => setExtension(e.target.value)}
                    size="small"
                    sx={{ width: 120 }}
                />
                </Stack>
            )}

            <FormControlLabel
                control={
                <Switch
                    checked={fromBrand}
                    onChange={(e) => setFromBrand(e.target.checked)}
                    size="small"
                />
                }
                label={
                <Typography variant="body2">Pertenece a un brandkit</Typography>
                }
            />
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
