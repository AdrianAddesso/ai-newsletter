import { useEffect, useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
    MenuItem,
    Stack,
    TextField,
    Alert,
} from "@mui/material";
import {
    createAiConfig,
    updateAiConfig,
    type AiConfig,
} from "../../../api/ai";
import {
  AiConfigType,
  AiConfigTypeLabel,
} from "@shared/enums/ai-config-type.enum";

interface AiConfigModalProps {
    open: boolean;
    config?: AiConfig | null;
    onClose: () => void;
    onConfirm: (saved: AiConfig) => void;
}

const TYPE_OPTIONS: { value: AiConfigType; label: string }[] = [
    { value: AiConfigType.CREATE, label: AiConfigTypeLabel[AiConfigType.CREATE] },
    {
        value: AiConfigType.REGENERATE,
        label: AiConfigTypeLabel[AiConfigType.REGENERATE],
    },
];

const DEFAULTS = {
    name: "",
    type: AiConfigType.CREATE,
    temperature: 0.5,
    top_p: 0.8,
    top_k: 20,
    max_output_tokens: 4000,
};

export function AiConfigModal({
    open,
    config,
    onClose,
    onConfirm,
    }: AiConfigModalProps) {
    const [name, setName] = useState(DEFAULTS.name);
    const [type, setType] = useState<AiConfigType>(DEFAULTS.type);
    const [temperature, setTemperature] = useState(DEFAULTS.temperature);
    const [topP, setTopP] = useState(DEFAULTS.top_p);
    const [topK, setTopK] = useState(DEFAULTS.top_k);
    const [maxOutputTokens, setMaxOutputTokens] = useState(
        DEFAULTS.max_output_tokens,
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEdit = Boolean(config);

    useEffect(() => {
        if (open) {
        setName(config?.name ?? DEFAULTS.name);
        setType(config?.type ?? DEFAULTS.type);
        setTemperature(config?.temperature ?? DEFAULTS.temperature);
        setTopP(config?.top_p ?? DEFAULTS.top_p);
        setTopK(config?.top_k ?? DEFAULTS.top_k);
        setMaxOutputTokens(
            config?.max_output_tokens ?? DEFAULTS.max_output_tokens,
        );
        setError(null);
        }
    }, [config, open]);

    const isValid =
        name.trim() !== "" &&
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
        setSubmitting(true);
        setError(null);
        try {
        let saved: AiConfig;
        if (isEdit && config) {
            saved = await updateAiConfig(config.id, {
            temperature,
            top_p: topP,
            top_k: topK,
            max_output_tokens: maxOutputTokens,
            });
        } else {
            saved = await createAiConfig({
            name: name.trim(),
            type,
            temperature,
            top_p: topP,
            top_k: topK,
            max_output_tokens: maxOutputTokens,
            });
        }
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
          {isEdit ? "Editar configuración de IA" : "Nueva configuración de IA"}
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
              disabled={isEdit}
              placeholder="ej: Newsletter Generation"
            />

            <TextField
              select
              label="Tipo"
              value={type}
              onChange={(e) => setType(e.target.value as AiConfigType)}
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
            {isEdit ? "Guardar cambios" : "Crear configuración"}
          </Button>
        </DialogActions>
      </Dialog>
    );
}
