import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DeleteOutlined as DeleteIcon,
  UploadFile as UploadIcon,
} from "@mui/icons-material";
import { ModalDelete } from "../../ModalDelete";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface FontEntry {
    id: string;
    name: string;
    style: string;
    file_name: string;
    extension?: string;
    size_bytes?: number;
    created_at: string;
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------
    const formatBytes = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    const STYLE_COLORS: Record<
    string,
    "default" | "primary" | "secondary" | "info"
    > = {
    Regular: "default",
    Bold: "primary",
    Italic: "secondary",
    "Bold Italic": "info",
    };

    // ---------------------------------------------------------------------------
    // Mock initial data
    // ---------------------------------------------------------------------------
    const INITIAL_FONTS: FontEntry[] = [
    {
        id: "1",
        name: "NestleBrush",
        style: "Regular",
        file_name: "NestleBrush-Regular.woff2",
        extension: "woff2",
        size_bytes: 98304,
        created_at: "2024-01-10",
    },
    {
        id: "2",
        name: "NestleBrush",
        style: "Bold",
        file_name: "NestleBrush-Bold.woff2",
        extension: "woff2",
        size_bytes: 102400,
        created_at: "2024-01-10",
    },
    {
        id: "3",
        name: "NeueHaas",
        style: "Regular",
        file_name: "NeueHaas-Regular.otf",
        extension: "otf",
        size_bytes: 210000,
        created_at: "2024-01-15",
    },
    ];

    // ---------------------------------------------------------------------------
    // Component
    // ---------------------------------------------------------------------------
    interface TypographyListProps {
    fonts?: FontEntry[];
    onChange?: (fonts: FontEntry[]) => void;
    }

    export function TypographyList({
    fonts: controlledFonts,
    onChange,
    }: TypographyListProps) {
    const [internalFonts, setInternalFonts] =
        useState<FontEntry[]>(INITIAL_FONTS);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fonts = controlledFonts ?? internalFonts;

    const setFonts = (updater: (prev: FontEntry[]) => FontEntry[]) => {
        const next = updater(fonts);
        if (onChange) {
        onChange(next);
        } else {
        setInternalFonts(next);
        }
    };

    const handleFileUpload = (files: FileList | null) => {
        if (!files) return;

        const newFonts: FontEntry[] = Array.from(files).map((file) => {
        const parts = file.name.split(".");
        const ext = parts.length > 1 ? parts.pop()! : "";
        const baseName = parts.join(".");

        // Heuristic: detect style from file name
        let style = "Regular";
        if (/bold/i.test(baseName) && /italic/i.test(baseName))
            style = "Bold Italic";
        else if (/bold/i.test(baseName)) style = "Bold";
        else if (/italic/i.test(baseName)) style = "Italic";

        // Family name: strip style keywords
        const familyName = baseName
            .replace(/[-_]?(bold|italic|regular|light|medium|thin|black)/gi, "")
            .replace(/[-_]+$/, "")
            .trim();

        return {
            id: String(Date.now()) + Math.random(),
            name: familyName || baseName,
            style,
            file_name: file.name,
            extension: ext,
            size_bytes: file.size,
            created_at: new Date().toISOString().split("T")[0],
        };
        });

        setFonts((prev) => [...prev, ...newFonts]);
    };

    const handleDelete = () => {
        setFonts((prev) => prev.filter((f) => f.id !== deleteId));
        setDeleteId(null);
    };

    return (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
            <Stack spacing={3}>
            {/* Header */}
            <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
                <Stack spacing={0.5}>
                <Typography variant="subtitle1">
                    Tipografías
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Cargá los archivos de fuentes del brandkit (.woff2, .otf, .ttf).
                </Typography>
                </Stack>

                <Box>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".woff,.woff2,.otf,.ttf,.eot"
                    multiple
                    hidden
                    onChange={(e) => handleFileUpload(e.target.files)}
                />
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<UploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                >
                    Subir fuente
                </Button>
                </Box>
            </Stack>

            {/* Drop zone hint */}
            <Box
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files);
                }}
                sx={{
                border: "2px dashed",
                borderColor: "divider",
                borderRadius: 2,
                p: 2,
                textAlign: "center",
                color: "text.secondary",
                cursor: "pointer",
                }}
                onClick={() => fileInputRef.current?.click()}
            >
                <Typography variant="caption">
                También podés arrastrar archivos de fuentes aquí
                </Typography>
            </Box>

            {/* Font list */}
            {fonts.length === 0 ? (
                <Alert severity="info">Aún no hay fuentes cargadas.</Alert>
            ) : (
                <TableContainer>
                <Table size="small">
                    <TableHead sx={{ bgcolor: "action.hover" }}>
                    <TableRow>
                        <TableCell>Familia</TableCell>
                        <TableCell>Estilo</TableCell>
                        <TableCell>Archivo</TableCell>
                        <TableCell>Tamaño</TableCell>
                        <TableCell>Cargado</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {fonts.map((font) => (
                        <TableRow key={font.id} hover>
                        <TableCell>
                            <Typography variant="body2">
                            {font.name}
                            </Typography>
                        </TableCell>
                        <TableCell>
                            <Chip
                            label={font.style}
                            size="small"
                            color={STYLE_COLORS[font.style] ?? "default"}
                            variant="outlined"
                            />
                        </TableCell>
                        <TableCell>
                            <Typography
                            variant="caption"
                            sx={{ fontFamily: "monospace" }}
                            >
                            {font.file_name}
                            </Typography>
                        </TableCell>
                        <TableCell>{formatBytes(font.size_bytes)}</TableCell>
                        <TableCell>{font.created_at}</TableCell>
                        <TableCell align="right">
                            <Tooltip title="Quitar fuente">
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteId(font.id)}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                            </Tooltip>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </TableContainer>
            )}
            </Stack>
        </CardContent>

        <ModalDelete
            open={Boolean(deleteId)}
            description="Esta acción eliminará la fuente del brandkit."
            onClose={() => setDeleteId(null)}
            onConfirm={handleDelete}
        />
        </Card>
    );
}
