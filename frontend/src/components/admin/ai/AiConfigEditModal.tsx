import { useEffect, useState } from "react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { AiConfigTypeLabel } from "@shared/enums/ai-config-type.enum";
import { updateAiConfig, type AiConfig } from "../../../api/ai";

interface AiConfigEditModalProps {
    open: boolean;
    config: AiConfig | null;
    onClose: () => void;
    onConfirm: (saved: AiConfig) => void;
}

export function AiConfigEditModal({
    open,
    config,
    onClose,
    onConfirm,
    }: AiConfigEditModalProps) {
    const [temperature, setTemperature] = useState(0);
    const [topP, setTopP] = useState(0);
    const [topK, setTopK] = useState(1);
    const [maxOutputTokens, setMaxOutputTokens] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && config) {
        setTemperature(config.temperature);
        setTopP(config.top_p);
        setTopK(config.top_k);
        setMaxOutputTokens(config.max_output_tokens);
        setError(null);
        }
    }, [config, open]);

    const isValid =
        temperature >= 0 &&
        temperature <= 1 &&
        topP >= 0 &&
        topP <= 1 &&
        Number.isInteger(topK) &&
        topK >= 1 &&
        Number.isInteger(maxOutputTokens) &&
        maxOutputTokens >= 1 &&
        maxOutputTokens <= 8192;

    const handleSubmit = async () => {
        if (!config) return;
        setSubmitting(true);
        setError(null);
        try {
        const saved = await updateAiConfig(config.id, {
            temperature,
            top_p: topP,
            top_k: topK,
            max_output_tokens: maxOutputTokens,
        });
        onConfirm(saved);
        } catch {
        setError("No se pudo guardar la configuración. Intentá de nuevo.");
        } finally {
        setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
            Editar configuración de IA
            {config && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {config.name} · {AiConfigTypeLabel[config.type]}
            </Typography>
            )}
        </DialogTitle>

        <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Stack direction="row" spacing={2}>
                <TextField
                label="Temperatura"
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                fullWidth
                size="small"
                required
                slotProps={{ htmlInput: { min: 0, max: 1, step: 0.01 } }}
                helperText="0.0 – 1.0"
                />
                <TextField
                label="Top P"
                type="number"
                value={topP}
                onChange={(e) => setTopP(Number(e.target.value))}
                fullWidth
                size="small"
                required
                slotProps={{ htmlInput: { min: 0, max: 1, step: 0.01 } }}
                helperText="0.0 – 1.0"
                />
            </Stack>

            <Stack direction="row" spacing={2}>
                <TextField
                label="Top K"
                type="number"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                fullWidth
                size="small"
                required
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
                helperText="Entero positivo"
                />
                <TextField
                label="Máx. tokens"
                type="number"
                value={maxOutputTokens}
                onChange={(e) => setMaxOutputTokens(Number(e.target.value))}
                fullWidth
                size="small"
                required
                slotProps={{
                    htmlInput: { min: 1, max: 8192, step: 1 },
                    input: {
                    endAdornment: (
                        <InputAdornment position="end">tokens</InputAdornment>
                    ),
                    },
                }}
                helperText="1 – 8192"
                />
            </Stack>

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
            Guardar cambios
            </Button>
        </DialogActions>
        </Dialog>
    );
}
