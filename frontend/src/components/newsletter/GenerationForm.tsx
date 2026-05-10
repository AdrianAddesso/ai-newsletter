import axios from "axios";
import { useEffect, useState, type ChangeEvent } from "react";
import {
  Alert,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Divider,
  FormControl,
  InputLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import {
  areaLabels,
  generationFieldLabels,
} from "../../utils/newsletterTemplates";
import {
  listAssets,
  listBrandKitAssets,
  uploadAssets,
  type AssetType,
  type UploadedAsset,
} from "../../api/assets";
import type { GenerateNewsletterRequest } from "../../api/ai";
import type { NewsletterTemplate } from "../../types/newsletter";
import CloseIcon from "@mui/icons-material/Close";

type FormValues = {
  topic: string;
  objective: string;
  audience: string;
  keyMessages: string;
  tone: string;
  relevantDates: string;
  cta: string;
  contact: string;
  linksOrSources: string;
  additionalContext: string;
  assetType: AssetType;
  files: File[];
};

const assetTypeLabels: Record<AssetType, string> = {
  IMAGE: "Imagen",
  ICON: "Icono",
  LOGO: "Logo",
  SHAPE: "Forma",
  LOCKUP: "Lockup",
  KEYWORD: "Keyword",
};

const splitLines = (v: string) =>
  v
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

const isValidUrl = (link: string) => {
  try {
    const u = new URL(link);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const validateLinks = (v: string): string | null => {
  const links = v
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return links.length > 0 && links.some((l) => !isValidUrl(l))
    ? "Todos los links deben ser válidos (http/https)."
    : null;
};

const validateDate = (v: string): string | null =>
  v.trim() && isNaN(Date.parse(v)) ? "Debe ser una fecha válida." : null;

type Props = {
  selectedTemplate: NewsletterTemplate;
  isGenerating: boolean;
  aiError: string | null;
  // Prefilled values when regenerating globally
  initialValues?: Partial<Omit<FormValues, "files">>;
  onGenerate: (request: GenerateNewsletterRequest) => Promise<void>;
  onCancel: () => void;
  cancelLabel?: string;
};

export function GenerationForm({
  selectedTemplate,
  isGenerating,
  aiError,
  initialValues,
  onGenerate,
  onCancel,
  cancelLabel = "Cancelar",
}: Props) {
  const [form, setForm] = useState<FormValues>({
    topic: initialValues?.topic ?? "",
    objective: initialValues?.objective ?? "",
    audience: initialValues?.audience ?? "",
    keyMessages: initialValues?.keyMessages ?? "",
    tone: initialValues?.tone ?? "",
    relevantDates: initialValues?.relevantDates ?? "",
    cta: initialValues?.cta ?? "",
    contact: initialValues?.contact ?? "",
    linksOrSources: initialValues?.linksOrSources ?? "",
    additionalContext: initialValues?.additionalContext ?? "",
    assetType: initialValues?.assetType ?? "IMAGE",
    files: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [availableAssets, setAvailableAssets] = useState<UploadedAsset[]>([]);
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const [selectedExistingAssets, setSelectedExistingAssets] = useState<
    UploadedAsset[]
  >([]);
  const [assetListError, setAssetListError] = useState<string | null>(null);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [assetUploadError, setAssetUploadError] = useState<string | null>(null);
  const [isUploadingAssets, setIsUploadingAssets] = useState(false);

  const visibleFields = new Set([
    ...selectedTemplate.requiredGenerationFields,
    ...selectedTemplate.optionalGenerationFields,
  ]);

  const update = (field: keyof FormValues, value: string | File[]) => {
    setForm((f) => ({ ...f, [field]: value }));
    setFormErrors((e) => {
      const n = { ...e };
      delete n[field];
      return n;
    });
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoadingAssets(true);
      setAssetListError(null);
      try {
        const res =
          form.assetType === "SHAPE"
            ? await listBrandKitAssets(selectedTemplate.brandKitId, form.assetType)
            : await listAssets(form.assetType);
        if (mounted) setAvailableAssets(res.assets ?? []);
      } catch (err) {
        if (mounted) {
          setAssetListError(
            axios.isAxiosError(err)
              ? (err.response?.data?.message ??
                  "No se pudieron obtener los assets.")
              : "No se pudieron obtener los assets.",
          );
          setAvailableAssets([]);
        }
      } finally {
        if (mounted) setIsLoadingAssets(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [form.assetType, selectedTemplate.brandKitId]);

  const isAssetSelected = (assetId: string) =>
    selectedExistingAssets.some((asset) => asset.id === assetId);

  const toggleExistingAsset = (asset: UploadedAsset) => {
    setSelectedExistingAssets((current) =>
      current.some((selectedAsset) => selectedAsset.id === asset.id)
        ? current.filter((selectedAsset) => selectedAsset.id !== asset.id)
        : [...current, asset],
    );
  };

  const removeSelectedAsset = (assetId: string) => {
    setSelectedExistingAssets((current) =>
      current.filter((asset) => asset.id !== assetId),
    );
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.topic.trim()) errors.topic = "El tema es obligatorio.";
    if (!form.objective.trim())
      errors.objective = "El objetivo es obligatorio.";
    if (!form.audience.trim()) errors.audience = "La audiencia es obligatoria.";
    if (splitLines(form.keyMessages).length < 1)
      errors.keyMessages = "Ingresa al menos un mensaje clave.";
    if (!form.tone.trim()) errors.tone = "El tono deseado es obligatorio.";
    const linkErr = validateLinks(form.linksOrSources);
    if (linkErr) errors.linksOrSources = linkErr;
    const dateErr = validateDate(form.relevantDates);
    if (dateErr) errors.relevantDates = dateErr;
    selectedTemplate.requiredGenerationFields.forEach((field) => {
      if (!form[field]?.toString().trim())
        errors[field] =
          `${generationFieldLabels[field]} es obligatorio para esta plantilla.`;
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    let assetIds = selectedExistingAssets.map((asset) => asset.id);
    setAssetUploadError(null);

    if (form.files.length > 0) {
      setIsUploadingAssets(true);
      try {
        const res = await uploadAssets(form.files, form.assetType);
        setUploadedAssets(res.assets);
        assetIds = [
          ...selectedExistingAssets.map((asset) => asset.id),
          ...res.assets.map((a) => a.id),
        ];
      } catch (err) {
        setAssetUploadError(
          axios.isAxiosError(err)
            ? (err.response?.data?.message ??
                "No se pudieron cargar los assets.")
            : "No se pudieron cargar los assets.",
        );
        return;
      } finally {
        setIsUploadingAssets(false);
      }
    } else {
      setUploadedAssets([]);
    }

    await onGenerate({
      area: selectedTemplate.area,
      templateId: selectedTemplate.id,
      brandKitId: selectedTemplate.brandKitId,
      topic: form.topic.trim(),
      objective: form.objective.trim(),
      audience: form.audience.trim(),
      keyMessages: splitLines(form.keyMessages),
      tone: form.tone.trim(),
      relevantDates: form.relevantDates.trim() || undefined,
      cta: form.cta.trim() || undefined,
      contact: form.contact.trim() || undefined,
      linksOrSources: splitLines(form.linksOrSources),
      additionalContext: form.additionalContext.trim() || undefined,
      assetIds,
    });
  };

  return (
    <Stack spacing={2}>
      {aiError && <Alert severity="error">{aiError}</Alert>}
      {assetUploadError && <Alert severity="error">{assetUploadError}</Alert>}
      <Alert severity="info">
        Plantilla seleccionada: {selectedTemplate.name}
      </Alert>

      <TextField
        label="Departamento o area"
        value={areaLabels[selectedTemplate.area]}
        fullWidth
        disabled
      />
      <TextField
        label="Tema del newsletter"
        required
        slotProps={{ inputLabel: { required: false } }}
        value={form.topic}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          update("topic", e.target.value)
        }
        error={!!formErrors.topic}
        helperText={formErrors.topic}
        fullWidth
      />
      <TextField
        label="Objetivo"
        required
        slotProps={{ inputLabel: { required: false } }}
        value={form.objective}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          update("objective", e.target.value)
        }
        error={!!formErrors.objective}
        helperText={formErrors.objective}
        multiline
        minRows={2}
        fullWidth
      />
      <TextField
        label="Audiencia"
        required
        slotProps={{ inputLabel: { required: false } }}
        value={form.audience}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          update("audience", e.target.value)
        }
        error={!!formErrors.audience}
        helperText={formErrors.audience}
        fullWidth
      />
      <TextField
        label="Mensajes clave"
        required
        slotProps={{ inputLabel: { required: false } }}
        value={form.keyMessages}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          update("keyMessages", e.target.value)
        }
        error={!!formErrors.keyMessages}
        helperText={formErrors.keyMessages || "Escribi un mensaje por linea."}
        multiline
        minRows={3}
        fullWidth
      />
      <TextField
        label="Tono deseado"
        required
        slotProps={{ inputLabel: { required: false } }}
        value={form.tone}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          update("tone", e.target.value)
        }
        error={!!formErrors.tone}
        helperText={formErrors.tone}
        fullWidth
      />

      {selectedTemplate.requiredGenerationFields.length > 0 && (
        <Alert severity="warning">
          Esta plantilla requiere:{" "}
          {selectedTemplate.requiredGenerationFields
            .map((f) => generationFieldLabels[f])
            .join(", ")}
        </Alert>
      )}
      {visibleFields.has("relevantDates") && (
        <TextField
          label="Fecha CTA"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          value={form.relevantDates}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            update("relevantDates", e.target.value)
          }
          error={!!formErrors.relevantDates}
          helperText={formErrors.relevantDates}
          fullWidth
        />
      )}
      {visibleFields.has("cta") && (
        <TextField
          label="Texto CTA"
          value={form.cta}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            update("cta", e.target.value)
          }
          error={!!formErrors.cta}
          helperText={formErrors.cta}
          fullWidth
        />
      )}
      {visibleFields.has("contact") && (
        <TextField
          label="Contacto"
          value={form.contact}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            update("contact", e.target.value)
          }
          error={!!formErrors.contact}
          helperText={formErrors.contact}
          fullWidth
        />
      )}
      {visibleFields.has("linksOrSources") && (
        <TextField
          label="Link CTA"
          type="url"
          value={form.linksOrSources}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            update("linksOrSources", e.target.value);
            const err = validateLinks(e.target.value);
            setFormErrors((prev) => {
              const next = { ...prev };
              if (err) next.linksOrSources = err;
              else delete next.linksOrSources;
              return next;
            });
          }}
          error={!!formErrors.linksOrSources}
          helperText={formErrors.linksOrSources || "Escribi un link por linea."}
          multiline
          minRows={2}
          fullWidth
        />
      )}

      <FormControl fullWidth size="small">
        <InputLabel id="asset-type-label">Tipo de asset</InputLabel>
        <Select
          labelId="asset-type-label"
          label="Tipo de asset"
          value={form.assetType}
          onChange={(e: SelectChangeEvent<AssetType>) => {
            update("assetType", e.target.value);
            setAssetUploadError(null);
          }}
        >
          {Object.entries(assetTypeLabels).map(([v, l]) => (
            <MenuItem key={v} value={v}>
              {l}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {assetListError && <Alert severity="error">{assetListError}</Alert>}
      {selectedExistingAssets.length > 0 && (
        <Stack spacing={1}>
          <Typography variant="subtitle2">Assets seleccionados</Typography>
          <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
            {selectedExistingAssets.map((asset) => (
              <Card
                key={asset.id}
                variant="outlined"
                sx={{
                  width: 176,
                  borderColor: "primary.main",
                  boxShadow: 3,
                }}
              >
                <CardMedia
                  component="img"
                  height="112"
                  image={asset.url}
                  alt={asset.name}
                  sx={{ objectFit: "cover", bgcolor: "grey.100" }}
                />
                  <CardContent sx={{ py: 1.25, "&:last-child": { pb: 1.25 } }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                    <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700 }}
                        noWrap
                        title={asset.name}
                      >
                        {asset.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {asset.type}
                      </Typography>
                    </Stack>
                    <IconButton
                      size="small"
                      aria-label={`Quitar ${asset.name}`}
                      onClick={() => removeSelectedAsset(asset.id)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Stack>
      )}
      {isLoadingAssets ? (
        <Alert severity="info">Cargando assets existentes...</Alert>
      ) : availableAssets.length > 0 ? (
        <Stack spacing={1}>
          <Typography variant="subtitle2">
            {form.assetType === "SHAPE"
              ? "Assets de la marca"
              : "Assets existentes"}
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{ flexWrap: "wrap" }}
          >
            {availableAssets.map((asset) => {
              const isSelected = isAssetSelected(asset.id);
              return (
                <Card
                  key={asset.id}
                  variant="outlined"
                  sx={{
                    width: 176,
                    borderColor: isSelected ? "primary.main" : "divider",
                    boxShadow: isSelected ? 3 : 0,
                  }}
                >
                  <CardActionArea
                    onClick={() =>
                      toggleExistingAsset(asset)
                    }
                  >
                    <CardMedia
                      component="img"
                      height="112"
                      image={asset.url}
                      alt={asset.name}
                      sx={{ objectFit: "cover", bgcolor: "grey.100" }}
                    />
                    <CardContent sx={{ py: 1.25, "&:last-child": { pb: 1.25 } }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700 }}
                        noWrap
                        title={asset.name}
                      >
                        {asset.name}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Stack>
        </Stack>
      ) : (
        <Alert severity="info">No hay assets existentes para este tipo.</Alert>
      )}

      <Button variant="outlined" component="label">
        Seleccionar imagenes o assets
        <input
          hidden
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.gif,.svg"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            update("files", Array.from(e.target.files ?? []));
            setUploadedAssets([]);
            setAssetUploadError(null);
          }}
        />
      </Button>
      {form.files.length > 0 && (
        <Alert severity="info">
          Archivos seleccionados: {form.files.map((f) => f.name).join(", ")}
        </Alert>
      )}
      {uploadedAssets.length > 0 && (
        <Alert severity="success">
          Assets cargados: {uploadedAssets.map((a) => a.name).join(", ")}
        </Alert>
      )}

      <Divider />

      {visibleFields.has("additionalContext") && (
        <Stack spacing={2}>
          <Typography variant="h6">Contexto adicional</Typography>
          <TextField
            label="Notas adicionales"
            value={form.additionalContext}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              update("additionalContext", e.target.value)
            }
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      )}

      <Button
        variant="contained"
        disabled={isGenerating || isUploadingAssets}
        onClick={() => void submit()}
      >
        {isGenerating || isUploadingAssets ? "Generando..." : "Generar"}
      </Button>
      <Button variant="outlined" color="error" onClick={onCancel}>
        {cancelLabel}
      </Button>
    </Stack>
  );
}
