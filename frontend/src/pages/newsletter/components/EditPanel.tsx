import axios from "axios";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import type { BlockAssetType, BlockEditField } from "@shared/types/block.types";
import {
  listAssets,
  uploadAsset,
  type AssetType,
  type UploadedAsset,
} from "../../../api/assets";
import type {
  BrandKitResourceAsset,
  BrandKitResources,
} from "../../../api/brand-kits";
import type {
  BlockReviewComment,
  NewsletterBlock,
  NewsletterState,
} from "../../../types/newsletter";
import { parseContent } from "../../../utils/blockContent";
import {
  getBlockAssetBinding,
  removeBlockAssetBinding,
  setBlockAssetBinding,
  updateBlockValue,
  updateBlockValues,
} from "../../../utils/newsletterBlocks";
import { buildKeywordSvgMarkup } from "../utils/keywordSvg";
import { AssetImageCard } from "./AssetImageCard";
import { ReviewHistoryPanel } from "./ReviewHistoryPanel";

type SelectableAssetType = Exclude<AssetType, "BLOCK">;
type UploadStatus =
  | "idle"
  | "compressing"
  | "uploading"
  | "success"
  | "error"
  | "cancelled";
type AssetSourceTab = "global" | "brandkit";
type BackgroundMode = "image" | "color" | "none";

type Props = {
  selectedBlock: NewsletterBlock;
  brandKitResources: BrandKitResources | null;
  newsletterState: NewsletterState;
  reviewHistory: BlockReviewComment[];
  submitLabel: string;
  isSubmitting: boolean;
  isSavingDraft: boolean;
  isRegeneratingBlock: boolean;
  aiError: string | null;
  onUpdateBlock: (block: NewsletterBlock) => void;
  onSaveDraft: () => Promise<void>;
  onRegenerateBlock: (blockId: string) => Promise<void>;
  onRegenerateAll: () => void;
  onSubmit: () => void;
  onCancel: () => void;
};

const assetTypeLabels: Record<SelectableAssetType, string> = {
  IMAGE: "Imagen",
  ICON: "Icono",
  LOGO: "Logo",
  SHAPE: "Forma",
  LOCKUP: "Lockup",
  KEYWORD: "Keyword",
};

const selectableAssetTypes = Object.keys(
  assetTypeLabels,
) as SelectableAssetType[];
const maxUploadBytes = 5 * 1024 * 1024;
const uploadableMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const compressibleMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const fontSizeOptions = [
  { label: "XS", value: "0.75rem" },
  { label: "S", value: "0.875rem" },
  { label: "M", value: "1rem" },
  { label: "L", value: "1.25rem" },
  { label: "XL", value: "1.5rem" },
  { label: "XXL", value: "2rem" },
];
const assetsPerPage = 6;

function isTextualField(field: BlockEditField): boolean {
  return field.type === "text" || field.type === "textarea";
}

function supportsIndependentTextSize(field: BlockEditField): boolean {
  if (!isTextualField(field)) {
    return false;
  }

  return field.key !== "altText" && field.key !== "iconName";
}

function supportsIndependentTypography(field: BlockEditField): boolean {
  return supportsIndependentTextSize(field);
}

function resolveBackgroundMode(
  storedMode: string | undefined,
  hasBackgroundAsset: boolean,
  hasBackgroundColor: boolean,
): BackgroundMode {
  if (
    storedMode === "image" ||
    storedMode === "color" ||
    storedMode === "none"
  ) {
    return storedMode;
  }

  if (hasBackgroundAsset) {
    return "image";
  }

  if (hasBackgroundColor) {
    return "color";
  }

  return "image";
}

function BackgroundStyleFieldEditor({
  block,
  backgroundAssetField,
  backgroundColorField,
  backgroundMode,
  brandKitResources,
  canEdit,
  onUpdateBlock,
}: {
  block: NewsletterBlock;
  backgroundAssetField: BlockEditField;
  backgroundColorField: BlockEditField | undefined;
  backgroundMode: BackgroundMode;
  brandKitResources: BrandKitResources | null;
  canEdit: boolean;
  onUpdateBlock: (block: NewsletterBlock) => void;
}) {
  const values = parseContent<Record<string, string>>(block.content);
  const availableModes: Array<{ value: BackgroundMode; label: string }> = [
    { value: "image", label: "Imagen" },
  ];

  if (backgroundColorField) {
    availableModes.push({ value: "color", label: "Color" });
  }

  availableModes.push({ value: "none", label: "Sin fondo" });

  const effectiveMode: BackgroundMode =
    availableModes.find((option) => option.value === backgroundMode)?.value ??
    "image";

  return (
    <Stack
      spacing={1.5}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        p: 1.5,
        backgroundColor: "background.paper",
      }}
    >
      <Typography variant="subtitle2">{backgroundAssetField.label}</Typography>

      <TextField
        select
        label="Tipo de fondo"
        value={effectiveMode}
        onChange={(event) =>
          onUpdateBlock(
            updateBlockValue(
              block,
              "backgroundMode",
              event.target.value as BackgroundMode,
            ),
          )
        }
        fullWidth
        disabled={!canEdit}
      >
        {availableModes.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      {effectiveMode === "image" && (
        <ImageAssetFieldEditor
          block={block}
          field={backgroundAssetField}
          canEdit={canEdit}
          brandKitResources={brandKitResources}
          onUpdateBlock={onUpdateBlock}
        />
      )}

      {effectiveMode === "color" && backgroundColorField && (
        <FieldEditor
          block={block}
          field={backgroundColorField}
          value={values[backgroundColorField.key] ?? ""}
          brandKitResources={brandKitResources}
          canEdit={canEdit}
          onUpdateBlock={onUpdateBlock}
          hideLabel
        />
      )}
    </Stack>
  );
}

export function EditPanel({
  selectedBlock,
  brandKitResources,
  newsletterState,
  reviewHistory,
  submitLabel,
  isSubmitting,
  isSavingDraft,
  isRegeneratingBlock,
  aiError,
  onUpdateBlock,
  onSaveDraft,
  onRegenerateBlock,
  onRegenerateAll,
  onSubmit,
  onCancel,
}: Props) {
  const canEdit =
    newsletterState === "DRAFT" || newsletterState === "CHANGES_REQUESTED";
  const values = useMemo(
    () => parseContent<Record<string, string>>(selectedBlock.content),
    [selectedBlock.content],
  );
  const hasTextFontSizeControl = selectedBlock.editFields.some(
    (field) => field.type === "font-size",
  );
  const hasTextFontFamilyControl =
    selectedBlock.editFields.some((field) => field.type === "font-family") &&
    (brandKitResources?.fonts.length ?? 0) > 0;
  const backgroundAssetField = selectedBlock.editFields.find(
    (field) => field.key === "backgroundAsset",
  );
  const backgroundColorField = selectedBlock.editFields.find(
    (field) => field.key === "bgColor" || field.key === "overlayColor",
  );
  const backgroundMode = resolveBackgroundMode(
    values.backgroundMode,
    getBlockAssetBinding(selectedBlock, "backgroundAsset") !== undefined,
    Boolean(values.bgColor?.trim() || values.overlayColor?.trim()),
  );

  return (
    <Stack
      sx={{
        height: "calc(100vh - 180px)",
        minHeight: 0,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: "background.paper",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 2,
          py: 2,
        }}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle1">{selectedBlock.name}</Typography>

          {aiError && <Alert severity="error">{aiError}</Alert>}

          {selectedBlock.editFields.map((field) => {
            if (field.type === "font-style" || field.type === "font-size") {
              return null;
            }

            if (field.type === "font-family") {
              return null;
            }

            if (field.key === "backgroundAsset") {
              if (!backgroundAssetField) {
                return null;
              }

              return (
                <BackgroundStyleFieldEditor
                  key="background-style"
                  block={selectedBlock}
                  backgroundAssetField={backgroundAssetField}
                  backgroundColorField={backgroundColorField}
                  backgroundMode={backgroundMode}
                  brandKitResources={brandKitResources}
                  canEdit={canEdit}
                  onUpdateBlock={onUpdateBlock}
                />
              );
            }

            if (field.key === "bgColor" || field.key === "overlayColor") {
              return null;
            }

            if (supportsIndependentTypography(field)) {
              return (
                <TextFieldGroupEditor
                  key={field.key}
                  block={selectedBlock}
                  field={field}
                  value={values[field.key] ?? ""}
                  fontSizeValue={
                    values[`${field.key}FontSize`] ?? values.fontSize ?? ""
                  }
                  fontFamilyValue={
                    values[`${field.key}FontFamily`] ?? values.fontFamily ?? ""
                  }
                  brandKitResources={brandKitResources}
                  canEdit={canEdit}
                  hasTextFontSizeControl={hasTextFontSizeControl}
                  hasTextFontFamilyControl={hasTextFontFamilyControl}
                  onUpdateBlock={onUpdateBlock}
                />
              );
            }

            return (
              <FieldEditor
                key={field.key}
                block={selectedBlock}
                field={field}
                value={values[field.key] ?? ""}
                brandKitResources={brandKitResources}
                canEdit={canEdit}
                onUpdateBlock={onUpdateBlock}
              />
            );
          })}

          {selectedBlock.editFields.length === 0 && (
            <Alert severity="info">
              Este bloque no tiene campos editables.
            </Alert>
          )}

          {canEdit && (
            <>
              {selectedBlock.editFields.some(
                (field) => field.type === "text" || field.type === "textarea",
              ) && (
                <Button
                  variant="outlined"
                  color="secondary"
                  disabled={isRegeneratingBlock}
                  onClick={() => void onRegenerateBlock(selectedBlock.id)}
                >
                  {isRegeneratingBlock
                    ? "Regenerando bloque..."
                    : "Regenerar este bloque con IA"}
                </Button>
              )}
              <Button
                variant="outlined"
                color="secondary"
                onClick={onRegenerateAll}
              >
                Regenerar todo el contenido
              </Button>
            </>
          )}

          <ReviewHistoryPanel
            comments={reviewHistory}
          />
        </Stack>
      </Box>

      <Divider />

      <Box
        sx={{
          backgroundColor: "background.paper",
          px: 2,
          py: 2,
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} sx={{justifyContent:"space-between"}}  spacing={1.5}>
          <Button
            variant="outlined"
            color="error"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          {canEdit && (
            <Button
              variant="contained"
              color="inherit"
              disabled={isSavingDraft}
              onClick={() => void onSaveDraft()}
            >
              {isSavingDraft ? "Guardando..." : "Guardar borrador"}
            </Button>
          )}
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={isSubmitting || !canEdit}
            sx={{ ml: { md: "auto" } }}
          >
            {isSubmitting ? "Enviando..." : submitLabel}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}

function FieldEditor({
  block,
  field,
  value,
  brandKitResources,
  canEdit,
  onUpdateBlock,
  hideLabel = false,
  compact = false,
}: {
  block: NewsletterBlock;
  field: BlockEditField;
  value: string;
  brandKitResources: BrandKitResources | null;
  canEdit: boolean;
  onUpdateBlock: (block: NewsletterBlock) => void;
  hideLabel?: boolean;
  compact?: boolean;
}) {
  const values = parseContent<Record<string, string>>(block.content);

  const setValue = (nextValue: string): void => {
    onUpdateBlock(updateBlockValue(block, field.key, nextValue));
  };

  if (field.type === "textarea") {
    return (
      <TextField
        label={field.label}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={field.placeholder}
        fullWidth
        multiline
        minRows={3}
        disabled={!canEdit}
      />
    );
  }

  if (field.type === "color") {
    return (
      <Stack spacing={1}>
        {!hideLabel && (
          <Typography variant="subtitle2">{field.label}</Typography>
        )}
        <Box
          component="input"
          type="color"
          value={value || "#ffffff"}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setValue(event.target.value)
          }
          disabled={!canEdit}
          sx={{
            width: "100%",
            height: 48,
            p: 0,
            border: "none",
            background: "transparent",
            cursor: canEdit ? "pointer" : "default",
          }}
        />
      </Stack>
    );
  }

  if (field.type === "font-size") {
    return (
      <TextField
        select
        value={value}
        onChange={(event) => setValue(event.target.value)}
        fullWidth
        disabled={!canEdit}
        sx={compact ? { minWidth: 180, maxWidth: 180 } : undefined}
      >
        <MenuItem value="">
          <em>Usar default</em>
        </MenuItem>
        {fontSizeOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label} · {option.value}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  if (field.type === "font-style") {
    return null;
  }

  if (field.type === "font-family") {
    const fontOptions = brandKitResources?.fonts ?? [];

    return (
      <TextField
        select
        label={field.label}
        value={value}
        onChange={(event) => {
          const selectedFont = fontOptions.find(
            (font) => font.name === event.target.value,
          );
          onUpdateBlock(
            updateBlockValues(block, {
              ...values,
              [field.key]: event.target.value,
              fontId: selectedFont?.id ?? "",
              typographyStyle: "",
            }),
          );
        }}
        fullWidth
        disabled={!canEdit}
        helperText={
          fontOptions.length === 0
            ? "El brandkit seleccionado no tiene tipografías disponibles."
            : undefined
        }
      >
        <MenuItem value="">
          <em>Usar default</em>
        </MenuItem>
        {fontOptions.map((font) => (
          <MenuItem key={font.id} value={font.name}>
            {font.name} · {font.style}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  if (field.type === "image-asset") {
    return (
      <ImageAssetFieldEditor
        block={block}
        field={field}
        canEdit={canEdit}
        brandKitResources={brandKitResources}
        onUpdateBlock={onUpdateBlock}
      />
    );
  }

  return (
    <TextField
      label={field.label}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={field.placeholder}
      type={field.type === "url" ? "url" : "text"}
      multiline={field.type === "text"}
      minRows={field.type === "text" ? 2 : undefined}
      fullWidth
      disabled={!canEdit}
    />
  );
}

function TextFieldGroupEditor({
  block,
  field,
  value,
  fontSizeValue,
  fontFamilyValue,
  brandKitResources,
  canEdit,
  hasTextFontSizeControl,
  hasTextFontFamilyControl,
  onUpdateBlock,
}: {
  block: NewsletterBlock;
  field: BlockEditField;
  value: string;
  fontSizeValue: string;
  fontFamilyValue: string;
  brandKitResources: BrandKitResources | null;
  canEdit: boolean;
  hasTextFontSizeControl: boolean;
  hasTextFontFamilyControl: boolean;
  onUpdateBlock: (block: NewsletterBlock) => void;
}) {
  return (
    <Stack
      spacing={1.5}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        p: 1.5,
        backgroundColor: "background.paper",
      }}
    >
      <FieldEditor
        block={block}
        field={field}
        value={value}
        brandKitResources={brandKitResources}
        canEdit={canEdit}
        onUpdateBlock={onUpdateBlock}
      />

      {(hasTextFontFamilyControl || hasTextFontSizeControl) && (
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ alignItems: { md: "flex-start" } }}
        >
          {hasTextFontFamilyControl ? (
            <TextFontFamilyFieldEditor
              block={block}
              fieldKey={field.key}
              value={fontFamilyValue}
              brandKitResources={brandKitResources}
              canEdit={canEdit}
              onUpdateBlock={onUpdateBlock}
            />
          ) : null}
          {hasTextFontSizeControl ? (
            <TextSizeFieldEditor
              block={block}
              sizeKey={`${field.key}FontSize`}
              value={fontSizeValue}
              canEdit={canEdit}
              onUpdateBlock={onUpdateBlock}
            />
          ) : null}
        </Stack>
      )}
    </Stack>
  );
}

function TextFontFamilyFieldEditor({
  block,
  fieldKey,
  value,
  brandKitResources,
  canEdit,
  onUpdateBlock,
}: {
  block: NewsletterBlock;
  fieldKey: string;
  value: string;
  brandKitResources: BrandKitResources | null;
  canEdit: boolean;
  onUpdateBlock: (block: NewsletterBlock) => void;
}) {
  const values = parseContent<Record<string, string>>(block.content);
  const fontOptions = brandKitResources?.fonts ?? [];

  return (
    <TextField
      select
      label="Tipografía"
      value={value}
      onChange={(event) => {
        const selectedFont = fontOptions.find(
          (font) => font.name === event.target.value,
        );

        onUpdateBlock(
          updateBlockValues(block, {
            ...values,
            [`${fieldKey}FontFamily`]: event.target.value,
            [`${fieldKey}FontId`]: selectedFont?.id ?? "",
          }),
        );
      }}
      fullWidth
      disabled={!canEdit}
      sx={{ minWidth: 240 }}
    >
      <MenuItem value="">
        <em>Usar default</em>
      </MenuItem>
      {fontOptions.map((font) => (
        <MenuItem key={font.id} value={font.name}>
          {font.name} · {font.style}
        </MenuItem>
      ))}
    </TextField>
  );
}

function TextSizeFieldEditor({
  block,
  sizeKey,
  value,
  canEdit,
  onUpdateBlock,
}: {
  block: NewsletterBlock;
  sizeKey: string;
  value: string;
  canEdit: boolean;
  onUpdateBlock: (block: NewsletterBlock) => void;
}) {
  return (
    <TextField
      select
      value={value}
      onChange={(event) =>
        onUpdateBlock(updateBlockValue(block, sizeKey, event.target.value))
      }
      label="Tamaño de texto"
      fullWidth
      disabled={!canEdit}
      sx={{ minWidth: 180, maxWidth: 180 }}
    >
      <MenuItem value="">
        <em>Usar default</em>
      </MenuItem>
      {fontSizeOptions.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label} · {option.value}
        </MenuItem>
      ))}
    </TextField>
  );
}

function ImageAssetFieldEditor({
  block,
  field,
  canEdit,
  brandKitResources,
  onUpdateBlock,
}: {
  block: NewsletterBlock;
  field: BlockEditField;
  canEdit: boolean;
  brandKitResources: BrandKitResources | null;
  onUpdateBlock: (block: NewsletterBlock) => void;
}) {
  const allowedTypes = selectableAssetTypes;
  const allowedTypesKey = allowedTypes.join("|");
  const [sourceTab, setSourceTab] = useState<AssetSourceTab>("global");
  const [globalAssetType, setGlobalAssetType] = useState<SelectableAssetType>(
    (getBlockAssetBinding(block, field.key)?.assetType as
      | SelectableAssetType
      | undefined) ??
      allowedTypes[0] ??
      "IMAGE",
  );
  const [globalAssets, setGlobalAssets] = useState<UploadedAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [assetListError, setAssetListError] = useState<string | null>(null);
  const [assetName, setAssetName] = useState("");
  const [assetDescription, setAssetDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [assetCatalogById, setAssetCatalogById] = useState<
    Record<string, UploadedAsset | BrandKitResourceAsset>
  >({});

  const selectedBinding = getBlockAssetBinding(block, field.key);
  const brandKitAssets = brandKitResources?.assets ?? [];
  const hasBrandKitAssets = brandKitAssets.length > 0;

  useEffect(() => {
    if (!allowedTypes.length) {
      return;
    }

    if (!allowedTypes.includes(globalAssetType)) {
      setGlobalAssetType(allowedTypes[0]);
    }
  }, [allowedTypesKey, allowedTypes, globalAssetType]);

  useEffect(() => {
    if (hasBrandKitAssets || sourceTab !== "brandkit") {
      return;
    }

    setSourceTab("global");
  }, [hasBrandKitAssets, sourceTab]);

  useEffect(() => {
    let mounted = true;

    const loadAssets = async (): Promise<void> => {
      if (!allowedTypes.length) {
        setGlobalAssets([]);
        return;
      }

      setIsLoadingAssets(true);
      setAssetListError(null);

      try {
        const response = await listAssets(globalAssetType);
        if (!mounted) return;

        setGlobalAssets(response.assets);
      } catch (error) {
        if (!mounted) return;

        setAssetListError(
          axios.isAxiosError(error)
            ? (error.response?.data?.message ??
                "No se pudieron obtener los assets.")
            : "No se pudieron obtener los assets.",
        );
        setGlobalAssets([]);
      } finally {
        if (mounted) {
          setIsLoadingAssets(false);
        }
      }
    };

    void loadAssets();

    return () => {
      mounted = false;
    };
  }, [allowedTypesKey, globalAssetType]);

  useEffect(() => {
    if (globalAssets.length === 0) {
      return;
    }

    setAssetCatalogById((current) => ({
      ...current,
      ...Object.fromEntries(globalAssets.map((asset) => [asset.id, asset])),
    }));
  }, [globalAssets]);

  useEffect(() => {
    if (brandKitAssets.length === 0) {
      return;
    }

    setAssetCatalogById((current) => ({
      ...current,
      ...Object.fromEntries(brandKitAssets.map((asset) => [asset.id, asset])),
    }));
  }, [brandKitAssets]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);
  const currentSelectedAsset = selectedBinding
    ? assetCatalogById[selectedBinding.assetId]
    : undefined;

  const handleSelectUploadedAsset = (
    asset: UploadedAsset | BrandKitResourceAsset,
  ): void => {
    setAssetCatalogById((current) => ({
      ...current,
      [asset.id]: asset,
    }));

    onUpdateBlock(
      setBlockAssetBinding(block, {
        fieldKey: field.key,
        assetId: asset.id,
        assetName: asset.name,
        assetUrl: resolveAssetPreviewUrl(asset),
        assetType: asset.type as BlockAssetType,
        keywordText: asset.keywordText ?? null,
      }),
    );
  };

  const handleRemoveAsset = (): void => {
    onUpdateBlock(removeBlockAssetBinding(block, field.key));
  };

  const handleKeywordTextChange = (keywordText: string): void => {
    if (!selectedBinding) {
      return;
    }

    onUpdateBlock(
      setBlockAssetBinding(block, {
        ...selectedBinding,
        keywordText,
        assetUrl: resolveAssetPreviewUrl(
          currentSelectedAsset ?? selectedBinding,
          keywordText,
        ),
      }),
    );
  };

  const handleUpload = async (): Promise<void> => {
    setUploadError(null);
    setUploadProgress(0);

    if (!assetName.trim()) {
      setUploadError("El nombre del asset es obligatorio.");
      setUploadStatus("error");
      return;
    }

    if (!selectedFile) {
      setUploadError("Seleccioná un archivo para subir.");
      setUploadStatus("error");
      return;
    }

    if (!uploadableMimeTypes.has(selectedFile.type)) {
      setUploadError("Solo se permiten imágenes JPG, PNG, WebP, GIF o SVG.");
      setUploadStatus("error");
      return;
    }

    try {
      setUploadStatus("compressing");
      const fileToUpload = await prepareUploadFile(selectedFile);

      if (fileToUpload.size > maxUploadBytes) {
        setUploadError("El archivo debe pesar 5 MB o menos.");
        setUploadStatus("error");
        return;
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setUploadStatus("uploading");

      const uploadedAsset = await uploadAsset({
        file: fileToUpload,
        type: globalAssetType,
        name: assetName.trim(),
        description: assetDescription.trim() || null,
        signal: abortController.signal,
        onUploadProgress: setUploadProgress,
      });

      setGlobalAssets((current) => [
        uploadedAsset,
        ...current.filter((asset) => asset.id !== uploadedAsset.id),
      ]);
      handleSelectUploadedAsset(uploadedAsset);
      setIsUploadDialogOpen(false);
      setUploadStatus("success");
      setUploadProgress(100);
      setSelectedFile(null);
      setAssetName("");
      setAssetDescription("");
    } catch (error) {
      if (
        axios.isCancel(error) ||
        (error instanceof DOMException && error.name === "AbortError")
      ) {
        setUploadStatus("cancelled");
        setUploadError("Carga cancelada.");
        return;
      }

      setUploadStatus("error");
      setUploadError(
        axios.isAxiosError(error)
          ? (error.response?.data?.message ?? "No se pudo subir el asset.")
          : "No se pudo subir el asset.",
      );
    } finally {
      abortControllerRef.current = null;
    }
  };

  const currentAssetPreview = selectedBinding ? (
    <AssetImageCard
      alt={selectedBinding.assetName ?? field.label}
      imageUrl={selectedBinding.assetUrl ?? undefined}
      assetType={selectedBinding.assetType as AssetType}
      svgTemplate={currentSelectedAsset?.svgTemplate ?? null}
      keywordText={selectedBinding.keywordText}
      maxChars={currentSelectedAsset?.maxChars ?? null}
      isKeywordEditing={selectedBinding.assetType === "KEYWORD" && canEdit}
      readOnlyKeyword={!canEdit}
      onKeywordTextChange={canEdit ? handleKeywordTextChange : undefined}
      onRemove={canEdit ? handleRemoveAsset : undefined}
      width={180}
      height={120}
    />
  ) : null;

  return (
    <Stack spacing={1.5}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">{field.label}</Typography>
        {field.required && (
          <Typography variant="caption" color="text.secondary">
            Campo sugerido como obligatorio por la definición del bloque.
          </Typography>
        )}
      </Stack>

      {currentAssetPreview}

      <Box
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
      >
        <Tabs
          value={sourceTab}
          onChange={(_event, nextValue: AssetSourceTab) =>
            setSourceTab(nextValue)
          }
          variant="fullWidth"
        >
          <Tab value="global" label="Assets globales" />
          {hasBrandKitAssets && (
            <Tab value="brandkit" label="Assets de brandkit" />
          )}
        </Tabs>

        <Box sx={{ p: 2 }}>
          {sourceTab === "global" ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1}>
                <FormControl
                  fullWidth
                  size="small"
                  disabled={!canEdit || allowedTypes.length <= 1}
                >
                  <InputLabel id={`${field.key}-global-type-label`}>
                    Tipo
                  </InputLabel>
                  <Select
                    labelId={`${field.key}-global-type-label`}
                    label="Tipo"
                    value={globalAssetType}
                    onChange={(event: SelectChangeEvent<SelectableAssetType>) =>
                      setGlobalAssetType(
                        event.target.value as SelectableAssetType,
                      )
                    }
                  >
                    {allowedTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {assetTypeLabels[type]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              {assetListError && (
                <Alert severity="error">{assetListError}</Alert>
              )}
              {isLoadingAssets && (
                <Alert severity="info">Cargando assets globales...</Alert>
              )}

              <AssetGrid
                assets={globalAssets}
                selectedAssetId={selectedBinding?.assetId ?? null}
                selectedKeywordText={selectedBinding?.keywordText ?? null}
                canEdit={canEdit}
                onSelect={handleSelectUploadedAsset}
                gridKey={`global-${field.key}-${globalAssetType}`}
              />

              <Divider />

              <Stack spacing={1.5}>
                <Button
                  variant="outlined"
                  disabled={!canEdit}
                  onClick={() => setIsUploadDialogOpen(true)}
                >
                  Subir asset nuevo
                </Button>
                {uploadStatus === "success" && (
                  <Alert severity="success">
                    Asset subido y asignado al bloque.
                  </Alert>
                )}
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={2}>
              {brandKitResources ? (
                <>
                  <Typography variant="subtitle2">
                    Assets de {brandKitResources.brandKit.name}
                  </Typography>
                  <AssetGrid
                    assets={brandKitAssets}
                    selectedAssetId={selectedBinding?.assetId ?? null}
                    selectedKeywordText={selectedBinding?.keywordText ?? null}
                    canEdit={canEdit}
                    onSelect={handleSelectUploadedAsset}
                    gridKey={`brandkit-${field.key}`}
                  />
                </>
              ) : (
                <Alert severity="info">
                  Este newsletter no tiene un brandkit cargado para seleccionar
                  assets.
                </Alert>
              )}
            </Stack>
          )}
        </Box>
      </Box>

      <Dialog
        open={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Subir asset de tipo {assetTypeLabels[globalAssetType]}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Alert severity="info">
              El asset se subirá como {assetTypeLabels[globalAssetType]}.
            </Alert>
            <TextField
              label="Nombre"
              value={assetName}
              onChange={(event) => setAssetName(event.target.value)}
              fullWidth
              size="small"
              disabled={
                !canEdit ||
                uploadStatus === "uploading" ||
                uploadStatus === "compressing"
              }
            />
            <TextField
              label="Descripción"
              value={assetDescription}
              onChange={(event) => setAssetDescription(event.target.value)}
              fullWidth
              size="small"
              multiline
              minRows={2}
              disabled={
                !canEdit ||
                uploadStatus === "uploading" ||
                uploadStatus === "compressing"
              }
            />
            <Button
              variant="outlined"
              component="label"
              disabled={
                !canEdit ||
                uploadStatus === "uploading" ||
                uploadStatus === "compressing"
              }
            >
              Seleccionar archivo
              <input
                hidden
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,.svg"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedFile(file);
                  setUploadStatus("idle");
                  setUploadError(null);
                  if (file && !assetName.trim()) {
                    setAssetName(file.name.replace(/\.[^.]+$/, ""));
                  }
                  event.target.value = "";
                }}
              />
            </Button>
            {selectedFile && (
              <Alert severity="info">
                Archivo seleccionado: {selectedFile.name} (
                {formatBytes(selectedFile.size)})
              </Alert>
            )}
            {(uploadStatus === "compressing" ||
              uploadStatus === "uploading") && (
              <Stack spacing={1}>
                <Typography variant="caption">
                  {uploadStatus === "compressing"
                    ? "Comprimiendo imagen..."
                    : `Subiendo asset ${uploadProgress}%`}
                </Typography>
                <LinearProgress
                  variant={
                    uploadStatus === "uploading"
                      ? "determinate"
                      : "indeterminate"
                  }
                  value={uploadProgress}
                />
              </Stack>
            )}
            {uploadStatus === "cancelled" && (
              <Alert severity="warning">Carga cancelada.</Alert>
            )}
            {uploadError && <Alert severity="error">{uploadError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            color="inherit"
            onClick={() => {
              if (uploadStatus === "uploading") {
                abortControllerRef.current?.abort();
                setUploadStatus("cancelled");
                setUploadError("Carga cancelada.");
              }
              setIsUploadDialogOpen(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={
              !canEdit ||
              !selectedFile ||
              uploadStatus === "uploading" ||
              uploadStatus === "compressing"
            }
            onClick={() => void handleUpload()}
          >
            Subir y usar asset
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function AssetGrid({
  assets,
  selectedAssetId,
  selectedKeywordText,
  canEdit,
  onSelect,
  gridKey,
}: {
  assets: Array<UploadedAsset | BrandKitResourceAsset>;
  selectedAssetId: string | null;
  selectedKeywordText: string | null;
  canEdit: boolean;
  onSelect: (asset: UploadedAsset | BrandKitResourceAsset) => void;
  gridKey: string;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(assets.length / assetsPerPage));
  const paginatedAssets = assets.slice(
    page * assetsPerPage,
    page * assetsPerPage + assetsPerPage,
  );

  useEffect(() => {
    setPage(0);
  }, [gridKey]);

  useEffect(() => {
    if (page <= pageCount - 1) {
      return;
    }

    setPage(Math.max(0, pageCount - 1));
  }, [page, pageCount]);

  if (assets.length === 0) {
    return (
      <Alert severity="info">No hay assets disponibles para este tipo.</Alert>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 1.5,
        }}
      >
        {paginatedAssets.map((asset) => (
          <AssetImageCard
            key={asset.id}
            alt={asset.name}
            imageUrl={asset.url}
            assetType={asset.type}
            svgTemplate={asset.svgTemplate}
            keywordText={
              asset.id === selectedAssetId
                ? (selectedKeywordText ?? asset.keywordText)
                : asset.keywordText
            }
            maxChars={asset.maxChars}
            isSelected={asset.id === selectedAssetId}
            readOnlyKeyword
            onClick={canEdit ? () => onSelect(asset) : undefined}
            width="100%"
            height={120}
          />
        ))}
      </Box>
      {pageCount > 1 && (
        <Stack sx={{ alignItems: "flex-end" }}>
          <Pagination
            count={pageCount}
            page={page + 1}
            onChange={(_event, nextPage) => setPage(nextPage - 1)}
            color="primary"
            size="small"
          />
        </Stack>
      )}
    </Stack>
  );
}

function resolveAssetPreviewUrl(
  asset:
    | Pick<UploadedAsset, "id" | "url" | "type" | "svgTemplate" | "keywordText">
    | Pick<
        BrandKitResourceAsset,
        "id" | "url" | "type" | "svgTemplate" | "keywordText"
      >
    | Pick<
        NewsletterBlock["assetBindings"][number],
        "assetId" | "assetUrl" | "assetType" | "keywordText"
      >,
  keywordTextOverride?: string | null,
): string | null {
  const assetType = "assetType" in asset ? asset.assetType : asset.type;
  const assetId = "assetId" in asset ? asset.assetId : asset.id;
  const assetUrl = "assetUrl" in asset ? asset.assetUrl : asset.url;

  if (
    assetType !== "KEYWORD" ||
    !("svgTemplate" in asset) ||
    !asset.svgTemplate
  ) {
    return assetUrl;
  }

  const markup = buildKeywordSvgMarkup(
    asset.svgTemplate,
    keywordTextOverride ?? asset.keywordText ?? "Editar",
    assetId,
  );

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`;
}

async function prepareUploadFile(file: File): Promise<File> {
  if (!compressibleMimeTypes.has(file.type)) {
    return file;
  }

  if (file.size <= maxUploadBytes) {
    return file;
  }

  return compressImage(file);
}

async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, Math.sqrt(maxUploadBytes / file.size));

  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("No se pudo comprimir la imagen.");
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.86, 0.76, 0.66, 0.56, 0.46]) {
    const blob = await canvasToBlob(canvas, "image/webp", quality);
    if (blob.size <= maxUploadBytes) {
      return new File([blob], replaceExtension(file.name, "webp"), {
        type: "image/webp",
        lastModified: Date.now(),
      });
    }
  }

  throw new Error("No se pudo comprimir la imagen por debajo de 5 MB.");
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("No se pudo comprimir la imagen."));
      },
      type,
      quality,
    );
  });
}

function replaceExtension(fileName: string, extension: string): string {
  return `${fileName.replace(/\.[^.]+$/, "")}.${extension}`;
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
