import axios from "axios";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Alert,
  Button,
  Collapse,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
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
  uploadAssets,
  type AssetType,
  type UploadedAsset,
} from "../../api/assets";
import type { GenerateNewsletterRequest } from "../../api/ai";
import type {
  NewsletterAssetSelection,
  NewsletterTemplate,
} from "../../types/newsletter";
import { AssetImageCard } from "./AssetImageCard";

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

const assetsPerPage = 12;
const keywordDefaultMaxChars = 20;

const dedupeAssets = (assets: UploadedAsset[]): UploadedAsset[] => {
  const assetsById = new Map<string, UploadedAsset>();

  assets.forEach((asset) => {
    assetsById.set(asset.id, asset);
  });

  return Array.from(assetsById.values());
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
  selectedBrandKitId: string;
  isGenerating: boolean;
  aiError: string | null;
  // Prefilled values when regenerating globally
  initialValues?: Partial<Omit<FormValues, "files">>;
  initialAssetSelection?: NewsletterAssetSelection | null;
  onGenerate: (
    request: GenerateNewsletterRequest,
    assetSelection: NewsletterAssetSelection,
  ) => Promise<void>;
  onCancel: () => void;
  cancelLabel?: string;
};

export function GenerationForm({
  selectedTemplate,
  selectedBrandKitId,
  isGenerating,
  aiError,
  initialValues,
  initialAssetSelection,
  onGenerate,
  onCancel,
  cancelLabel = "Cancelar",
}: Props) {
  const initialAssetType = initialValues?.assetType ?? "IMAGE";
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
    assetType: initialAssetType,
    files: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [availableAssets, setAvailableAssets] = useState<UploadedAsset[]>([]);
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const [selectedExistingAssets, setSelectedExistingAssets] = useState<
    UploadedAsset[]
  >(initialAssetSelection?.selectedAssets ?? []);
  const [assetListError, setAssetListError] = useState<string | null>(null);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [assetUploadError, setAssetUploadError] = useState<string | null>(null);
  const [isUploadingAssets, setIsUploadingAssets] = useState(false);
  const [isAvailableAssetsCollapsed, setIsAvailableAssetsCollapsed] =
    useState(false);
  const [availableAssetsPage, setAvailableAssetsPage] = useState(1);
  const hasInitializedAssetType = useRef(false);
  const [editingKeywordAssetId, setEditingKeywordAssetId] = useState<
    string | null
  >(null);

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
        const res = await listAssets(form.assetType);
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
  }, [form.assetType]);

  useEffect(() => {
    if (!hasInitializedAssetType.current) {
      hasInitializedAssetType.current = true;
      return;
    }

    setUploadedAssets([]);
    setForm((current) => ({ ...current, files: [] }));
    setAssetUploadError(null);
    setAvailableAssetsPage(1);
    setEditingKeywordAssetId(null);
  }, [form.assetType]);

  const isAssetSelected = (assetId: string) =>
    selectedExistingAssets.some((asset) => asset.id === assetId);

  const toggleExistingAsset = (asset: UploadedAsset) => {
    setSelectedExistingAssets((current) =>
      current.some((selectedAsset) => selectedAsset.id === asset.id)
        ? current.filter((selectedAsset) => selectedAsset.id !== asset.id)
        : [...current, asset],
    );
  };

  const toggleAssetSelection = (asset: UploadedAsset) => {
    if (asset.type === "KEYWORD") {
      setSelectedExistingAssets((current) => {
        const existingAsset = current.find(
          (selectedAsset) => selectedAsset.id === asset.id,
        );

        if (existingAsset) {
          return current;
        }

        return [
          ...current,
          {
            ...asset,
            keywordText: asset.keywordText ?? "",
          },
        ];
      });
      setEditingKeywordAssetId(asset.id);
      return;
    }

    toggleExistingAsset(asset);
  };

  const removeSelectedAsset = (assetId: string) => {
    setSelectedExistingAssets((current) =>
      current.filter((asset) => asset.id !== assetId),
    );
    setEditingKeywordAssetId((current) =>
      current === assetId ? null : current,
    );
  };

  const updateKeywordText = (assetId: string, value: string) => {
    setSelectedExistingAssets((current) =>
      current.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              keywordText: value.slice(
                0,
                asset.maxChars ?? keywordDefaultMaxChars,
              ),
            }
          : asset,
      ),
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
    const invalidKeywordSelection = selectedExistingAssets.some(
      (asset) => asset.type === "KEYWORD" && !asset.keywordText?.trim(),
    );
    if (invalidKeywordSelection) {
      errors.assetSelection =
        "Cada keyword seleccionado debe tener un texto antes de generar.";
    }
    selectedTemplate.requiredGenerationFields.forEach((field) => {
      if (!form[field]?.toString().trim())
        errors[field] =
          `${generationFieldLabels[field]} es obligatorio para esta plantilla.`;
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const availableAssetsPageCount = Math.max(
    1,
    Math.ceil(availableAssets.length / assetsPerPage),
  );
  const currentAvailableAssetsPage = Math.min(
    availableAssetsPage,
    availableAssetsPageCount,
  );
  const paginatedAvailableAssets = availableAssets.slice(
    (currentAvailableAssetsPage - 1) * assetsPerPage,
    currentAvailableAssetsPage * assetsPerPage,
  );

  const submit = async () => {
    if (!validate()) return;
    let selectedAssets = dedupeAssets(selectedExistingAssets);
    let assetIds = selectedAssets.map((asset) => asset.id);
    setAssetUploadError(null);

    if (form.files.length > 0) {
      setIsUploadingAssets(true);
      try {
        const res = await uploadAssets(form.files, form.assetType);
        setUploadedAssets(res.assets);
        selectedAssets = dedupeAssets([
          ...selectedExistingAssets,
          ...res.assets,
        ]);
        setSelectedExistingAssets(selectedAssets);
        assetIds = selectedAssets.map((asset) => asset.id);
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

    const request: GenerateNewsletterRequest = {
      area: selectedTemplate.area,
      templateId: selectedTemplate.id,
      brandKitId: selectedBrandKitId,
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
    };

    await onGenerate(request, {
      selectedAssets,
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
      {formErrors.assetSelection && (
        <Alert severity="warning">{formErrors.assetSelection}</Alert>
      )}
      {selectedExistingAssets.length > 0 && (
        <Stack spacing={1}>
          <Typography variant="subtitle2">Assets seleccionados</Typography>
          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{ flexWrap: "wrap" }}
          >
            {selectedExistingAssets.map((asset) => (
              <AssetImageCard
                key={asset.id}
                alt={asset.name}
                imageUrl={asset.url}
                assetType={asset.type}
                svgTemplate={asset.svgTemplate}
                keywordText={asset.keywordText}
                maxChars={asset.maxChars}
                isKeywordEditing={editingKeywordAssetId === asset.id}
                onKeywordTextChange={(value) =>
                  updateKeywordText(asset.id, value)
                }
                onClick={
                  asset.type === "KEYWORD"
                    ? () => setEditingKeywordAssetId(asset.id)
                    : undefined
                }
                isSelected
                onRemove={() => removeSelectedAsset(asset.id)}
              />
            ))}
          </Stack>
        </Stack>
      )}
      {isLoadingAssets ? (
        <Alert severity="info">Cargando assets existentes...</Alert>
      ) : availableAssets.length > 0 ? (
        <Stack spacing={1}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <Typography variant="subtitle2">Assets existentes</Typography>
            <Button
              variant="text"
              size="small"
              onClick={() =>
                setIsAvailableAssetsCollapsed((current) => !current)
              }
            >
              {isAvailableAssetsCollapsed ? "Expandir" : "Colapsar"}
            </Button>
          </Stack>
          <Collapse in={!isAvailableAssetsCollapsed}>
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                spacing={1.5}
                useFlexGap
                sx={{ flexWrap: "wrap" }}
              >
                {paginatedAvailableAssets.map((asset) => {
                  const isSelected = isAssetSelected(asset.id);
                  return (
                    <AssetImageCard
                      key={asset.id}
                      alt={asset.name}
                      imageUrl={asset.url}
                      assetType={asset.type}
                      svgTemplate={asset.svgTemplate}
                      keywordText={
                        selectedExistingAssets.find(
                          (selectedAsset) => selectedAsset.id === asset.id,
                        )?.keywordText
                      }
                      maxChars={asset.maxChars}
                      isKeywordEditing={
                        editingKeywordAssetId === asset.id && !isSelected
                      }
                      onKeywordTextChange={(value) =>
                        updateKeywordText(asset.id, value)
                      }
                      isSelected={isSelected}
                      onClick={() => toggleAssetSelection(asset)}
                    />
                  );
                })}
              </Stack>
              {availableAssets.length > assetsPerPage && (
                <Pagination
                  count={availableAssetsPageCount}
                  page={currentAvailableAssetsPage}
                  onChange={(_event, page) => setAvailableAssetsPage(page)}
                  color="primary"
                  size="small"
                />
              )}
            </Stack>
          </Collapse>
        </Stack>
      ) : (
        <Alert severity="info">No hay assets existentes para este tipo.</Alert>
      )}

      {form.assetType === "KEYWORD" ? (
        <Alert severity="info">
          Los keywords usan solo las plantillas SVG predefinidas. Seleccioná una
          y editá el texto inline.
        </Alert>
      ) : (
        <>
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
        </>
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
