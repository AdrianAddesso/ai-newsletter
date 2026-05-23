import { useEffect, useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    } from "@mui/material";

    export interface AiAttribute {
    id: string;
    key: string;
    value: string;
    description?: string;
    created_at: string;
    }

    interface AiConfigAddModalProps {
    open: boolean;
    attribute?: AiAttribute | null;
    onClose: () => void;
    onConfirm: (data: Omit<AiAttribute, "id" | "created_at">) => void;
    }

    export function AiConfigAddModal({
    open,
    attribute,
    onClose,
    onConfirm,
    }: AiConfigAddModalProps) {
    const [key, setKey] = useState("");
    const [value, setValue] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (open) {
        setKey(attribute?.key ?? "");
        setValue(attribute?.value ?? "");
        setDescription(attribute?.description ?? "");
        }
    }, [attribute, open]);

    const handleSubmit = () => {
        onConfirm({
        key: key.trim(),
        value: value.trim(),
        description: description.trim(),
        });
    };

    const isValid = key.trim() !== "" && value.trim() !== "";

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
            {attribute ? "Editar atributo de IA" : "Nuevo atributo de IA"}
        </DialogTitle>

        <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
                label="Clave"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                fullWidth
                size="small"
                placeholder="ej: prompt_base"
                required
            />
            <TextField
                label="Valor"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={5}
                placeholder="Ingresá el valor del atributo..."
                required
            />
            <TextField
                label="Descripción (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                size="small"
                placeholder="Descripción breve del atributo"
            />
            </Stack>
        </DialogContent>

        <DialogActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
            {attribute ? "Guardar cambios" : "Agregar atributo"}
            </Button>
        </DialogActions>
        </Dialog>
    );
}
