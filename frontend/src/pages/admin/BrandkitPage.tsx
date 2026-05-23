import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Snackbar,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  SaveOutlined as SaveIcon,
} from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router";
import { BrandInfo } from "../../components/admin/branding/BrandInfo";
import { TypographyList } from "../../components/admin/branding/TypographyList";
import { ColorList } from "../../components/admin/branding/ColorList";
import { AssetsList } from "../../components/admin/assets/AssetsList";
import type { BrandInfoValues } from "../../components/admin/branding/BrandInfo";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export function BrandkitPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const brandkitId = searchParams.get("id");
    const isEditing = Boolean(brandkitId);

  // -------------------------------------------------------------------------
  // Form state
  // -------------------------------------------------------------------------
    const [brandInfo, setBrandInfo] = useState<BrandInfoValues>({
        name: isEditing ? "Comunicación Interna 2024" : "",
        active: false,
    });

    const [errors, setErrors] = useState<
        Partial<Record<keyof BrandInfoValues, string>>
    >({});
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error";
    }>({ open: false, message: "", severity: "success" });

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------
    const validate = (): boolean => {
        const newErrors: typeof errors = {};
        if (!brandInfo.name.trim()) {
        newErrors.name = "El nombre del brandkit es obligatorio.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // -------------------------------------------------------------------------
    // Save
    // -------------------------------------------------------------------------
    const handleSave = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
        // TODO: Replace with real API call
        await new Promise<void>((resolve) => setTimeout(resolve, 800));
        setSnackbar({
            open: true,
            message: isEditing
            ? "Brandkit actualizado correctamente."
            : "Brandkit creado correctamente.",
            severity: "success",
        });
        setTimeout(() => navigate("/admin"), 1200);
        } catch {
        setSnackbar({
            open: true,
            message: "Ocurrió un error al guardar el brandkit. Intentá de nuevo.",
            severity: "error",
        });
        } finally {
        setSaving(false);
        }
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    return (
      <Box
        sx={{
          py: 0,
          px: 3,
          bgcolor: "background.default",
          height: "100vh",
          overflowY: "auto",
          scrollbarGutter: "stable",
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Stack spacing={3}>
            {/* ----------------------------------------------------------------
                Page header
            ---------------------------------------------------------------- */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
              }}
            >
              <Stack spacing={0}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <Button
                    size="small"
                    startIcon={<BackIcon />}
                    onClick={() => navigate("/admin")}
                    sx={{ color: "text.secondary" }}
                  >
                    Volver al panel de administración
                  </Button>
                </Stack>
                <Typography variant="h2">
                  {isEditing ? "Editar Brandkit" : "Nuevo Brandkit"}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {isEditing
                    ? "Modificá la información, colores, fuentes y assets del brandkit."
                    : "Configurá un nuevo brandkit para tus newsletters."}
                </Typography>
              </Stack>

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  whiteSpace: "nowrap",
                  alignSelf: { xs: "flex-start", sm: "center" },
                }}
              >
                {saving
                  ? "Guardando..."
                  : isEditing
                    ? "Guardar cambios"
                    : "Crear brandkit"}
              </Button>
            </Stack>

            {/* ----------------------------------------------------------------
                Section 1 — Brand info
            ---------------------------------------------------------------- */}
            <BrandInfo
              values={brandInfo}
              onChange={setBrandInfo}
              errors={errors}
            />

            {/* ----------------------------------------------------------------
                Section 2 — Typography
            ---------------------------------------------------------------- */}
            <TypographyList />

            {/* ----------------------------------------------------------------
                Section 3 — Colors
            ---------------------------------------------------------------- */}
            <ColorList />

            {/* ----------------------------------------------------------------
                Section 4 — Assets (reused component, brand-scoped)
            ---------------------------------------------------------------- */}
            <Box>
              <Stack spacing={1} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Assets del brandkit</Typography>
                <Typography variant="body2" color="text.secondary">
                  Imágenes y archivos asociados a este brandkit.
                </Typography>
              </Stack>
              <AssetsList compact />
            </Box>

            {/* ----------------------------------------------------------------
                Bottom save bar
            ---------------------------------------------------------------- */}
            <Box
              sx={{
                position: "sticky",
                bottom: 16,
                display: "flex",
                justifyContent: "flex-end",
                pt: 2,
              }}
            >
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/backoffice")}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? "Guardando..."
                    : isEditing
                      ? "Guardar cambios"
                      : "Crear brandkit"}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Container>

        {/* Feedback snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
    }
