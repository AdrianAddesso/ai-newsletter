import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  DeleteOutlined as DeleteIcon,
  EditOutlined as EditIcon,
} from "@mui/icons-material";
import { ModalDelete } from "../../ModalDelete";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Color {
    id: string;
    name: string;
    hex: string;
    created_at: string;
    created_by_user_id?: string;
    }

    // ---------------------------------------------------------------------------
    // Sub-component: Color dialog (add / edit)
    // ---------------------------------------------------------------------------
    interface ColorDialogProps {
    open: boolean;
    color?: Color | null;
    onClose: () => void;
    onConfirm: (data: Pick<Color, "name" | "hex">) => void;
    }

    function ColorDialog({ open, color, onClose, onConfirm }: ColorDialogProps) {
    const [name, setName] = useState("");
    const [hex, setHex] = useState("#000000");

    // Sync when dialog opens
    useState(() => {
        if (open) {
        setName(color?.name ?? "");
        setHex(color?.hex ?? "#000000");
        }
    });

    // Keep form in sync with prop changes
    useMemo(() => {
        if (open) {
        setName(color?.name ?? "");
        setHex(color?.hex ?? "#000000");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const isValid = name.trim() !== "" && /^#[0-9A-Fa-f]{6}$/.test(hex);

    const handleSubmit = () => {
        onConfirm({ name: name.trim(), hex });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>{color ? "Editar color" : "Nuevo color"}</DialogTitle>
        <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
            {/* Color picker + hex preview */}
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Box
                component="input"
                type="color"
                value={hex}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setHex(e.target.value)
                }
                sx={{
                    width: 48,
                    height: 48,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    cursor: "pointer",
                    padding: "2px",
                    bgcolor: "transparent",
                }}
                />
                <TextField
                label="Código HEX"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                size="small"
                placeholder="#FF0000"
                sx={{ flex: 1 }}
                error={hex !== "" && !/^#[0-9A-Fa-f]{6}$/.test(hex)}
                helperText={
                    hex !== "" && !/^#[0-9A-Fa-f]{6}$/.test(hex)
                    ? "Formato inválido. Usá #RRGGBB"
                    : undefined
                }
                />
            </Stack>

            <TextField
                label="Nombre del color"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                size="small"
                required
                placeholder="ej: Rojo Corporativo"
            />
            </Stack>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
            {color ? "Guardar cambios" : "Agregar color"}
            </Button>
        </DialogActions>
        </Dialog>
    );
    }

    // ---------------------------------------------------------------------------
    // Main component
    // ---------------------------------------------------------------------------
    const INITIAL_COLORS: Color[] = [
    { id: "1", name: "Rojo Nestle", hex: "#DC0000", created_at: "2024-01-01" },
    { id: "2", name: "Gris Oscuro", hex: "#333333", created_at: "2024-01-01" },
    { id: "3", name: "Blanco", hex: "#FFFFFF", created_at: "2024-01-01" },
    {
        id: "4",
        name: "Azul Corporativo",
        hex: "#004B87",
        created_at: "2024-01-02",
    },
    ];

    interface ColorListProps {
    /** Optional controlled list — if provided the component is controlled */
    colors?: Color[];
    onChange?: (colors: Color[]) => void;
    }

    export function ColorList({
    colors: controlledColors,
    onChange,
    }: ColorListProps) {
    const [internalColors, setInternalColors] = useState<Color[]>(INITIAL_COLORS);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Color | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const colors = controlledColors ?? internalColors;

    const setColors = (updater: (prev: Color[]) => Color[]) => {
        const next = updater(colors);
        if (onChange) {
        onChange(next);
        } else {
        setInternalColors(next);
        }
    };

    const openAdd = () => {
        setEditTarget(null);
        setDialogOpen(true);
    };

    const openEdit = (color: Color) => {
        setEditTarget(color);
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setEditTarget(null);
    };

    const handleConfirm = (data: Pick<Color, "name" | "hex">) => {
        if (editTarget) {
        setColors((prev) =>
            prev.map((c) => (c.id === editTarget.id ? { ...c, ...data } : c)),
        );
        } else {
        const newColor: Color = {
            ...data,
            id: String(Date.now()),
            created_at: new Date().toISOString().split("T")[0],
        };
        setColors((prev) => [...prev, newColor]);
        }
        handleDialogClose();
    };

    const handleDelete = () => {
        setColors((prev) => prev.filter((c) => c.id !== deleteId));
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
                    Paleta de colores
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Definí los colores corporativos de este brandkit.
                </Typography>
                </Stack>
                <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={openAdd}
                >
                Agregar color
                </Button>
            </Stack>

            {/* Color grid */}
            {colors.length === 0 ? (
                <Alert severity="info">Aún no hay colores definidos.</Alert>
            ) : (
                <Box
                sx={{
                    display: "grid",
                    gap: 1.5,
                    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                }}
                >
                {colors.map((color) => (
                    <Box
                    key={color.id}
                    sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        overflow: "hidden",
                    }}
                    >
                    {/* Color swatch */}
                    <Box
                        sx={{
                        height: 56,
                        bgcolor: color.hex,
                        border:
                            color.hex.toUpperCase() === "#FFFFFF"
                            ? "1px solid"
                            : "none",
                        borderColor: "divider",
                        }}
                    />
                    {/* Meta + actions */}
                    <Stack
                        direction="row"
                        sx={{
                        px: 1,
                        py: 0.5,
                        alignItems: "center",
                        justifyContent: "space-between",
                        }}
                    >
                        <Stack spacing={0}>
                        <Typography variant="caption" noWrap>
                            {color.name}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontFamily: "monospace", fontSize: "0.65rem" }}
                        >
                            {color.hex.toUpperCase()}
                        </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0}>
                        <Tooltip title="Editar">
                            <IconButton
                            size="small"
                            onClick={() => openEdit(color)}
                            >
                            <EditIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Borrar">
                            <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteId(color.id)}
                            >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                        </Stack>
                    </Stack>
                    </Box>
                ))}
                </Box>
            )}
            </Stack>
        </CardContent>

        {/* Dialogs */}
        <ColorDialog
            open={dialogOpen}
            color={editTarget}
            onClose={handleDialogClose}
            onConfirm={handleConfirm}
        />

        <ModalDelete
            open={Boolean(deleteId)}
            description="Esta acción eliminará el color de forma permanente."
            onClose={() => setDeleteId(null)}
            onConfirm={handleDelete}
        />
        </Card>
    );
}
