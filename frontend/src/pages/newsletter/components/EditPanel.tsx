import axios from 'axios'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import type { BlockAssetType, BlockEditField } from '@shared/types/block.types'
import {
  listAssets,
  uploadAsset,
  type AssetType,
  type UploadedAsset,
} from '../../../api/assets'
import type {
  BrandKitResourceAsset,
  BrandKitResources,
} from '../../../api/brand-kits'
import type { NewsletterBlock, NewsletterState } from '../../../types/newsletter'
import { parseContent } from '../../../utils/blockContent'
import {
  getBlockAssetBinding,
  removeBlockAssetBinding,
  setBlockAssetBinding,
  updateBlockValue,
  updateBlockValues,
} from '../../../utils/newsletterBlocks'
import { AssetImageCard } from './AssetImageCard'

type SelectableAssetType = Exclude<AssetType, 'BLOCK'>
type UploadStatus =
  | 'idle'
  | 'compressing'
  | 'uploading'
  | 'success'
  | 'error'
  | 'cancelled'
type AssetSourceTab = 'global' | 'brandkit'

type Props = {
  selectedBlock: NewsletterBlock
  brandKitResources: BrandKitResources | null
  newsletterComment: string | null
  newsletterState: NewsletterState
  submitLabel: string
  isSubmitting: boolean
  isSavingDraft: boolean
  isRegeneratingBlock: boolean
  aiError: string | null
  onUpdateBlock: (block: NewsletterBlock) => void
  onSaveDraft: () => Promise<void>
  onRegenerateBlock: (blockId: string) => Promise<void>
  onRegenerateAll: () => void
  onSubmit: () => void
  onCancel: () => void
}

const assetTypeLabels: Record<SelectableAssetType, string> = {
  IMAGE: 'Imagen',
  ICON: 'Icono',
  LOGO: 'Logo',
  SHAPE: 'Forma',
  LOCKUP: 'Lockup',
  KEYWORD: 'Keyword',
}

const selectableAssetTypes = Object.keys(assetTypeLabels) as SelectableAssetType[]
const maxUploadBytes = 5 * 1024 * 1024
const uploadableMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
])
const compressibleMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const fontSizeOptions = [
  { label: 'XS', value: '0.75rem' },
  { label: 'S', value: '0.875rem' },
  { label: 'M', value: '1rem' },
  { label: 'L', value: '1.25rem' },
  { label: 'XL', value: '1.5rem' },
  { label: 'XXL', value: '2rem' },
]

const emptyComment = (value: string | null): boolean =>
  !value || value.trim().length === 0

export function EditPanel({
  selectedBlock,
  brandKitResources,
  newsletterComment,
  newsletterState,
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
    newsletterState === 'DRAFT' || newsletterState === 'CHANGES_REQUESTED'
  const values = useMemo(
    () => parseContent<Record<string, string>>(selectedBlock.content),
    [selectedBlock.content],
  )

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography variant="subtitle1">{selectedBlock.name}</Typography>
        {canEdit && (
          <Button
            variant="contained"
            size="small"
            disabled={isSavingDraft}
            onClick={() => void onSaveDraft()}
          >
            {isSavingDraft ? 'Guardando...' : 'Guardar borrador'}
          </Button>
        )}
      </Stack>

      {aiError && <Alert severity="error">{aiError}</Alert>}

      {selectedBlock.editFields.map((field) => (
        <FieldEditor
          key={field.key}
          block={selectedBlock}
          field={field}
          value={values[field.key] ?? ''}
          brandKitResources={brandKitResources}
          canEdit={canEdit}
          onUpdateBlock={onUpdateBlock}
        />
      ))}

      {selectedBlock.editFields.length === 0 && (
        <Alert severity="info">Este bloque no tiene campos editables.</Alert>
      )}

      {canEdit && (
        <>
          {selectedBlock.editFields.some(
            (field) => field.type === 'text' || field.type === 'textarea',
          ) && (
            <Button
              variant="outlined"
              color="secondary"
              disabled={isRegeneratingBlock}
              onClick={() => void onRegenerateBlock(selectedBlock.id)}
            >
              {isRegeneratingBlock
                ? 'Regenerando bloque...'
                : 'Regenerar este bloque con IA'}
            </Button>
          )}
          <Button variant="outlined" color="secondary" onClick={onRegenerateAll}>
            Regenerar todo el contenido
          </Button>
        </>
      )}

      {!emptyComment(newsletterComment) && (
        <Alert severity="info">{newsletterComment}</Alert>
      )}

      <Divider />

      <Button variant="contained" onClick={onSubmit} disabled={isSubmitting || !canEdit}>
        {isSubmitting ? 'Enviando...' : submitLabel}
      </Button>
      <Button variant="outlined" color="error" onClick={onCancel} disabled={isSubmitting}>
        Cancelar
      </Button>
    </Stack>
  )
}

function FieldEditor({
  block,
  field,
  value,
  brandKitResources,
  canEdit,
  onUpdateBlock,
}: {
  block: NewsletterBlock
  field: BlockEditField
  value: string
  brandKitResources: BrandKitResources | null
  canEdit: boolean
  onUpdateBlock: (block: NewsletterBlock) => void
}) {
  const values = parseContent<Record<string, string>>(block.content)

  const setValue = (nextValue: string): void => {
    onUpdateBlock(updateBlockValue(block, field.key, nextValue))
  }

  if (field.type === 'textarea') {
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
    )
  }

  if (field.type === 'color') {
    return (
      <Stack spacing={1}>
        <Typography variant="subtitle2">{field.label}</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={field.placeholder}
            fullWidth
            disabled={!canEdit}
          />
          <Box
            component="input"
            type="color"
            value={value || '#ffffff'}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setValue(event.target.value)
            }
            disabled={!canEdit}
            sx={{
              width: 44,
              height: 44,
              p: 0,
              border: 'none',
              background: 'transparent',
              cursor: canEdit ? 'pointer' : 'default',
            }}
          />
        </Box>
      </Stack>
    )
  }

  if (field.type === 'font-size') {
    return (
      <TextField
        select
        label={field.label}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        fullWidth
        disabled={!canEdit}
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
    )
  }

  if (field.type === 'font-style') {
    const active = value ? value.split(',').filter(Boolean) : []

    return (
      <Stack spacing={1}>
        <Typography variant="subtitle2">{field.label}</Typography>
        <ToggleButtonGroup
          value={active}
          onChange={(_event, next: string[]) => setValue(next.join(','))}
          size="small"
          disabled={!canEdit}
        >
          <ToggleButton value="bold" aria-label="bold">
            <FormatBoldIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="italic" aria-label="italic">
            <FormatItalicIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    )
  }

  if (field.type === 'font-family') {
    const fontOptions = brandKitResources?.fonts ?? []

    return (
      <TextField
        select
        label={field.label}
        value={value}
        onChange={(event) => {
          const selectedFont = fontOptions.find(
            (font) => font.name === event.target.value,
          )
          onUpdateBlock(
            updateBlockValues(block, {
              ...values,
              [field.key]: event.target.value,
              fontId: selectedFont?.id ?? '',
            }),
          )
        }}
        fullWidth
        disabled={!canEdit}
        helperText={
          fontOptions.length === 0
            ? 'El brandkit seleccionado no tiene tipografías disponibles.'
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
    )
  }

  if (field.type === 'image-asset') {
    return (
      <ImageAssetFieldEditor
        block={block}
        field={field}
        canEdit={canEdit}
        brandKitResources={brandKitResources}
        onUpdateBlock={onUpdateBlock}
      />
    )
  }

  return (
    <TextField
      label={field.label}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={field.placeholder}
      type={field.type === 'url' ? 'url' : 'text'}
      multiline={field.type === 'text'}
      minRows={field.type === 'text' ? 2 : undefined}
      fullWidth
      disabled={!canEdit}
    />
  )
}

function ImageAssetFieldEditor({
  block,
  field,
  canEdit,
  brandKitResources,
  onUpdateBlock,
}: {
  block: NewsletterBlock
  field: BlockEditField
  canEdit: boolean
  brandKitResources: BrandKitResources | null
  onUpdateBlock: (block: NewsletterBlock) => void
}) {
  const allowedTypes = useMemo(
    () =>
      (field.assetTypes?.length ? field.assetTypes : selectableAssetTypes).filter(
        (type): type is SelectableAssetType => type !== 'BLOCK',
      ),
    [field.assetTypes],
  )
  const allowedTypesKey = allowedTypes.join('|')
  const [sourceTab, setSourceTab] = useState<AssetSourceTab>('global')
  const [globalAssetType, setGlobalAssetType] = useState<SelectableAssetType>(
    allowedTypes[0] ?? 'IMAGE',
  )
  const [globalAssets, setGlobalAssets] = useState<UploadedAsset[]>([])
  const [isLoadingAssets, setIsLoadingAssets] = useState(false)
  const [assetListError, setAssetListError] = useState<string | null>(null)
  const [assetName, setAssetName] = useState('')
  const [assetDescription, setAssetDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const selectedBinding = getBlockAssetBinding(block, field.key)
  const brandKitAssets = useMemo(
    () =>
      (brandKitResources?.assets ?? []).filter((asset) =>
        allowedTypes.includes(asset.type as SelectableAssetType),
      ),
    [allowedTypesKey, brandKitResources],
  )

  useEffect(() => {
    if (!allowedTypes.length) {
      return
    }

    if (!allowedTypes.includes(globalAssetType)) {
      setGlobalAssetType(allowedTypes[0])
    }
  }, [allowedTypesKey, allowedTypes, globalAssetType])

  useEffect(() => {
    let mounted = true

    const loadAssets = async (): Promise<void> => {
      if (!allowedTypes.length) {
        setGlobalAssets([])
        return
      }

      setIsLoadingAssets(true)
      setAssetListError(null)

      try {
        const response = await listAssets(globalAssetType)
        if (!mounted) return

        setGlobalAssets(
          response.assets.filter((asset) =>
            allowedTypes.includes(asset.type as SelectableAssetType),
          ),
        )
      } catch (error) {
        if (!mounted) return

        setAssetListError(
          axios.isAxiosError(error)
            ? error.response?.data?.message ?? 'No se pudieron obtener los assets.'
            : 'No se pudieron obtener los assets.',
        )
        setGlobalAssets([])
      } finally {
        if (mounted) {
          setIsLoadingAssets(false)
        }
      }
    }

    void loadAssets()

    return () => {
      mounted = false
    }
  }, [allowedTypesKey, globalAssetType])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const globalOptions = useMemo(() => {
    if (
      !selectedBinding ||
      globalAssets.some((asset) => asset.id === selectedBinding.assetId)
    ) {
      return globalAssets
    }

    if (!selectedBinding.assetType) {
      return globalAssets
    }

    return [
      {
        id: selectedBinding.assetId,
        name: selectedBinding.assetName ?? field.label,
        description: null,
        created_at: '',
        updated_at: '',
        url: selectedBinding.assetUrl ?? '',
        type: selectedBinding.assetType,
        svgTemplate: selectedBinding.svgTemplate ?? null,
        maxChars: selectedBinding.maxChars ?? null,
        keywordText: selectedBinding.keywordText ?? null,
      },
      ...globalAssets,
    ]
  }, [field.label, globalAssets, selectedBinding])

  const handleSelectUploadedAsset = (
    asset: UploadedAsset | BrandKitResourceAsset,
  ): void => {
    onUpdateBlock(
      setBlockAssetBinding(block, {
        fieldKey: field.key,
        assetId: asset.id,
        assetName: asset.name,
        assetUrl: asset.url,
        assetType: asset.type as BlockAssetType,
        keywordText: asset.keywordText ?? null,
        svgTemplate: asset.svgTemplate ?? null,
        maxChars: asset.maxChars ?? null,
      }),
    )
  }

  const handleRemoveAsset = (): void => {
    onUpdateBlock(removeBlockAssetBinding(block, field.key))
  }

  const handleKeywordTextChange = (keywordText: string): void => {
    if (!selectedBinding) {
      return
    }

    onUpdateBlock(
      setBlockAssetBinding(block, {
        ...selectedBinding,
        keywordText,
      }),
    )
  }

  const handleUpload = async (): Promise<void> => {
    setUploadError(null)
    setUploadProgress(0)

    if (!assetName.trim()) {
      setUploadError('El nombre del asset es obligatorio.')
      setUploadStatus('error')
      return
    }

    if (!selectedFile) {
      setUploadError('Seleccioná un archivo para subir.')
      setUploadStatus('error')
      return
    }

    if (!uploadableMimeTypes.has(selectedFile.type)) {
      setUploadError('Solo se permiten imágenes JPG, PNG, WebP, GIF o SVG.')
      setUploadStatus('error')
      return
    }

    try {
      setUploadStatus('compressing')
      const fileToUpload = await prepareUploadFile(selectedFile)

      if (fileToUpload.size > maxUploadBytes) {
        setUploadError('El archivo debe pesar 5 MB o menos.')
        setUploadStatus('error')
        return
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      setUploadStatus('uploading')

      const uploadedAsset = await uploadAsset({
        file: fileToUpload,
        type: globalAssetType,
        name: assetName.trim(),
        description: assetDescription.trim() || null,
        signal: abortController.signal,
        onUploadProgress: setUploadProgress,
      })

      setGlobalAssets((current) => [
        uploadedAsset,
        ...current.filter((asset) => asset.id !== uploadedAsset.id),
      ])
      handleSelectUploadedAsset(uploadedAsset)
      setUploadStatus('success')
      setUploadProgress(100)
      setSelectedFile(null)
      setAssetName('')
      setAssetDescription('')
    } catch (error) {
      if (
        axios.isCancel(error) ||
        (error instanceof DOMException && error.name === 'AbortError')
      ) {
        setUploadStatus('cancelled')
        setUploadError('Carga cancelada.')
        return
      }

      setUploadStatus('error')
      setUploadError(
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? 'No se pudo subir el asset.'
          : 'No se pudo subir el asset.',
      )
    } finally {
      abortControllerRef.current = null
    }
  }

  const currentAssetPreview = selectedBinding ? (
    <AssetImageCard
      alt={selectedBinding.assetName ?? field.label}
      imageUrl={selectedBinding.assetUrl ?? undefined}
      assetType={selectedBinding.assetType as AssetType}
      svgTemplate={selectedBinding.svgTemplate}
      keywordText={selectedBinding.keywordText}
      maxChars={selectedBinding.maxChars}
      isKeywordEditing={selectedBinding.assetType === 'KEYWORD' && canEdit}
      readOnlyKeyword={!canEdit}
      onKeywordTextChange={canEdit ? handleKeywordTextChange : undefined}
      onRemove={canEdit ? handleRemoveAsset : undefined}
      width={180}
      height={120}
    />
  ) : null

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

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Tabs
          value={sourceTab}
          onChange={(_event, nextValue: AssetSourceTab) => setSourceTab(nextValue)}
          variant="fullWidth"
        >
          <Tab value="global" label="Assets globales" />
          <Tab value="brandkit" label="Assets de brandkit" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {sourceTab === 'global' ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1}>
                <FormControl fullWidth size="small" disabled={!canEdit || allowedTypes.length <= 1}>
                  <InputLabel id={`${field.key}-global-type-label`}>Tipo</InputLabel>
                  <Select
                    labelId={`${field.key}-global-type-label`}
                    label="Tipo"
                    value={globalAssetType}
                    onChange={(event: SelectChangeEvent<SelectableAssetType>) =>
                      setGlobalAssetType(event.target.value as SelectableAssetType)
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

              {assetListError && <Alert severity="error">{assetListError}</Alert>}
              {isLoadingAssets && (
                <Alert severity="info">Cargando assets globales...</Alert>
              )}

              <AssetGrid
                assets={globalOptions}
                selectedAssetId={selectedBinding?.assetId ?? null}
                selectedKeywordText={selectedBinding?.keywordText ?? null}
                canEdit={canEdit}
                onSelect={handleSelectUploadedAsset}
              />

              <Divider />

              <Stack spacing={1.5}>
                <Typography variant="subtitle2">Subir imagen</Typography>
                <TextField
                  label="Nombre"
                  value={assetName}
                  onChange={(event) => setAssetName(event.target.value)}
                  fullWidth
                  size="small"
                  disabled={!canEdit || uploadStatus === 'uploading' || uploadStatus === 'compressing'}
                />
                <TextField
                  label="Descripción"
                  value={assetDescription}
                  onChange={(event) => setAssetDescription(event.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  disabled={!canEdit || uploadStatus === 'uploading' || uploadStatus === 'compressing'}
                />
                <Button
                  variant="outlined"
                  component="label"
                  disabled={!canEdit || uploadStatus === 'uploading' || uploadStatus === 'compressing'}
                >
                  Seleccionar archivo
                  <input
                    hidden
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.svg"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const file = event.target.files?.[0] ?? null
                      setSelectedFile(file)
                      setUploadStatus('idle')
                      setUploadError(null)
                      if (file && !assetName.trim()) {
                        setAssetName(file.name.replace(/\.[^.]+$/, ''))
                      }
                      event.target.value = ''
                    }}
                  />
                </Button>
                {selectedFile && (
                  <Alert severity="info">
                    Archivo seleccionado: {selectedFile.name} ({formatBytes(selectedFile.size)})
                  </Alert>
                )}
                {(uploadStatus === 'compressing' || uploadStatus === 'uploading') && (
                  <Stack spacing={1}>
                    <Typography variant="caption">
                      {uploadStatus === 'compressing'
                        ? 'Comprimiendo imagen...'
                        : `Subiendo asset ${uploadProgress}%`}
                    </Typography>
                    <LinearProgress
                      variant={uploadStatus === 'uploading' ? 'determinate' : 'indeterminate'}
                      value={uploadProgress}
                    />
                    {uploadStatus === 'uploading' && (
                      <Button
                        variant="text"
                        color="error"
                        onClick={() => {
                          abortControllerRef.current?.abort()
                          setUploadStatus('cancelled')
                          setUploadError('Carga cancelada.')
                        }}
                      >
                        Cancelar carga
                      </Button>
                    )}
                  </Stack>
                )}
                {uploadStatus === 'success' && (
                  <Alert severity="success">Asset subido y asignado al bloque.</Alert>
                )}
                {uploadStatus === 'cancelled' && (
                  <Alert severity="warning">Carga cancelada.</Alert>
                )}
                {uploadError && <Alert severity="error">{uploadError}</Alert>}
                <Button
                  variant="contained"
                  disabled={
                    !canEdit ||
                    !selectedFile ||
                    uploadStatus === 'uploading' ||
                    uploadStatus === 'compressing'
                  }
                  onClick={() => void handleUpload()}
                >
                  Subir y usar asset
                </Button>
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
                  />
                </>
              ) : (
                <Alert severity="info">
                  Este newsletter no tiene un brandkit cargado para seleccionar assets.
                </Alert>
              )}
            </Stack>
          )}
        </Box>
      </Box>
    </Stack>
  )
}

function AssetGrid({
  assets,
  selectedAssetId,
  selectedKeywordText,
  canEdit,
  onSelect,
}: {
  assets: Array<UploadedAsset | BrandKitResourceAsset>
  selectedAssetId: string | null
  selectedKeywordText: string | null
  canEdit: boolean
  onSelect: (asset: UploadedAsset | BrandKitResourceAsset) => void
}) {
  if (assets.length === 0) {
    return <Alert severity="info">No hay assets disponibles para este tipo.</Alert>
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 1.5,
      }}
    >
      {assets.map((asset) => (
        <AssetImageCard
          key={asset.id}
          alt={asset.name}
          imageUrl={asset.url}
          assetType={asset.type}
          svgTemplate={asset.svgTemplate}
          keywordText={
            asset.id === selectedAssetId
              ? selectedKeywordText ?? asset.keywordText
              : asset.keywordText
          }
          maxChars={asset.maxChars}
          isSelected={asset.id === selectedAssetId}
          readOnlyKeyword
          onClick={canEdit ? () => onSelect(asset) : undefined}
          width={180}
          height={120}
        />
      ))}
    </Box>
  )
}

async function prepareUploadFile(file: File): Promise<File> {
  if (!compressibleMimeTypes.has(file.type)) {
    return file
  }

  if (file.size <= maxUploadBytes) {
    return file
  }

  return compressImage(file)
}

async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const scale = Math.min(1, Math.sqrt(maxUploadBytes / file.size))

  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))

  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('No se pudo comprimir la imagen.')
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  for (const quality of [0.86, 0.76, 0.66, 0.56, 0.46]) {
    const blob = await canvasToBlob(canvas, 'image/webp', quality)
    if (blob.size <= maxUploadBytes) {
      return new File([blob], replaceExtension(file.name, 'webp'), {
        type: 'image/webp',
        lastModified: Date.now(),
      })
    }
  }

  throw new Error('No se pudo comprimir la imagen por debajo de 5 MB.')
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
          resolve(blob)
          return
        }

        reject(new Error('No se pudo comprimir la imagen.'))
      },
      type,
      quality,
    )
  })
}

function replaceExtension(fileName: string, extension: string): string {
  return `${fileName.replace(/\.[^.]+$/, '')}.${extension}`
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
