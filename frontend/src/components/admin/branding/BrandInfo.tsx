import {
  Card,
  CardContent,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

export interface BrandInfoValues {
    name: string;
    active: boolean;
    }

    interface BrandInfoProps {
    values: BrandInfoValues;
    onChange: (values: BrandInfoValues) => void;
    errors?: Partial<Record<keyof BrandInfoValues, string>>;
    }

    export function BrandInfo({ values, onChange, errors }: BrandInfoProps) {
    const handleChange =
        <K extends keyof BrandInfoValues>(field: K) =>
        (value: BrandInfoValues[K]) => {
        onChange({ ...values, [field]: value });
        };

    return (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
            <Stack spacing={3}>
            <Stack spacing={0.5}>
                <Typography variant="subtitle1">
                Información general
                </Typography>
                <Typography variant="body2" color="text.secondary">
                Datos básicos del brandkit.
                </Typography>
            </Stack>

            <Stack spacing={2.5}>
                <TextField
                label="Nombre del brandkit"
                value={values.name}
                onChange={(e) => handleChange("name")(e.target.value)}
                fullWidth
                size="small"
                required
                error={Boolean(errors?.name)}
                helperText={errors?.name}
                placeholder="ej: Comunicación Interna 2024"
                />

                <FormControlLabel
                control={
                    <Switch
                    checked={values.active}
                    onChange={(e) => handleChange("active")(e.target.checked)}
                    size="small"
                    />
                }
                label={
                    <Stack spacing={0}>
                    <Typography variant="body2">
                        Brandkit activo
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Solo un brandkit puede estar activo a la vez
                    </Typography>
                    </Stack>
                }
                />
            </Stack>
            </Stack>
        </CardContent>
        </Card>
    );
}
