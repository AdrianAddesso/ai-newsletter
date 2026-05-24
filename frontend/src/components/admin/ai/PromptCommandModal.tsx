import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import {
    AiConfigType,
    AiConfigTypeLabel,
} from "@shared/enums/ai-config-type.enum";
import {
    createPromptCommand,
    updatePromptCommand,
    type PromptCommand,
} from "../../../api/ai";

interface PromptCommandModalProps {
    open: boolean;
    command: PromptCommand | null;
    onClose: () => void;
    onConfirm: (saved: PromptCommand) => void;
}

const TYPE_OPTIONS = [
    { value: AiConfigType.CREATE, label: AiConfigTypeLabel[AiConfigType.CREATE] },
    {
        value: AiConfigType.REGENERATE,
        label: AiConfigTypeLabel[AiConfigType.REGENERATE],
    },
];

export function PromptCommandModal({
    open,
    command,
    onClose,
    onConfirm,
    }: PromptCommandModalProps) {
    const [name, setName] = useState("");
    const [type, setType] = useState<
        (typeof AiConfigType)[keyof typeof AiConfigType]
    >(AiConfigType.CREATE);
    const [displayOrder, setDisplayOrder] = useState(0);
    const [instruction, setInstruction] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEdit = Boolean(command);

    useEffect(() => {
        if (open) {
        setName(command?.name ?? "");
        setType(command?.type ?? AiConfigType.CREATE);
        setDisplayOrder(command?.display_order ?? 0);
        setInstruction(command?.instruction ?? "");
        setError(null);
        }
    }, [command, open]);

    const isValid =
        name.trim() !== "" && Number.isInteger(displayOrder) && displayOrder >= 0;

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        try {
        let saved: PromptCommand;
        if (isEdit && command) {
            saved = await updatePromptCommand(command.id, {
            name: name.trim(),
            display_order: displayOrder,
            instruction: instruction.trim() || undefined,
            });
        } else {
            saved = await createPromptCommand({
            name: name.trim(),
            type,
            display_order: displayOrder,
            instruction: instruction.trim() || undefined,
            });
        }
        onConfirm(saved);
        } catch {
        setError("No se pudo guardar la instrucción. Intentá de nuevo.");
        } finally {
        setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
            {isEdit
            ? "Editar instrucción de prompt"
            : "Nueva instrucción de prompt"}
        </DialogTitle>

        <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
                label="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                size="small"
                required
                placeholder="ej: Role definition"
            />

            <Stack direction="row" spacing={2}>
                <TextField
                select
                label="Tipo"
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                fullWidth
                size="small"
                required
                disabled={isEdit}
                >
                {TYPE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                    </MenuItem>
                ))}
                </TextField>

                <TextField
                label="Orden"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                fullWidth
                size="small"
                required
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                helperText="Posición en el prompt"
                />
            </Stack>

            <TextField
                label="Instrucción"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={5}
                placeholder="Ingresá el texto de la instrucción..."
            />

            {error && <Alert severity="error">{error}</Alert>}
            </Stack>
        </DialogContent>

        <DialogActions>
            <Button onClick={onClose} disabled={submitting}>
            Cancelar
            </Button>
            <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            >
            {isEdit ? "Guardar cambios" : "Agregar instrucción"}
            </Button>
        </DialogActions>
        </Dialog>
    );
}
