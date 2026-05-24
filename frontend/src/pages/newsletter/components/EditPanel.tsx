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
  TextField,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'
import {
  listAssets,
  uploadAsset,
  type AssetType,
  type UploadedAsset,
} from '../../../api/assets'
import type {
  NewsletterBlock,
  NewsletterBlockField,
  NewsletterState,
} from '../../../types/newsletter'
import { AssetImageCard } from './AssetImageCard'
import { buildKeywordSvgMarkup } from '../utils/keywordSvg'

type SelectableAssetType = Exclude<AssetType, 'BLOCK'>
type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'success' | 'error' | 'cancelled'

type Props = {
  selectedBlock: NewsletterBlock
  newsletterComment: string | null
  newsletterState: NewsletterState
  submitLabel: string
  isSubmitting: boolean
  isSavingDraft: boolean
  isRegeneratingBlock: boolean
  aiError: string | null
  onUpdateField: (
    blockId: string,
    fieldId: string,
    value: Partial<NewsletterBlockField>,
  ) => void
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

const selectableAssetTypes = Object.entries(assetTypeLabels) as [
  SelectableAssetType,
  string,
][]
const maxUploadBytes = 5 * 1024 * 1024
const uploadableMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
])
const compressibleMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const emptyComment = (value: string | null): boolean =>
  !value || value.trim().length === 0

export function EditPanel({
  selectedBlock,
  newsletterComment,
  newsletterState,
  submitLabel,
  isSubmitting,
  isSavingDraft,
  isRegeneratingBlock,
  aiError,
  onUpdateField,
  onSaveDraft,
  onRegenerateBlock,
  onRegenerateAll,
  onSubmit,
  onCancel,
}: Props) {
  const canEdit = newsletterState === 'DRAFT' || newsletterState === 'CHANGES_REQUESTED'
  const textFields = selectedBlock.fields.filter((field) => field.kind !== 'asset')
  const assetFields = selectedBlock.fields.filter((field) => field.kind === 'asset')

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">{selectedBlock.name}</Typography>
      {aiError && <Alert severity="error">{aiError}</Alert>}

      {textFields.map((field) => (
        <TextField
          key={field.id}
          label={field.label}
          value={field.value ?? ''}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onUpdateField(selectedBlock.id, field.id, { value: event.target.value })
          }
          multiline
          minRows={field.kind === 'text' ? 3 : 1}
          fullWidth
          disabled={!canEdit}
        />
      ))}

      {assetFields.map((field) => (
        <AssetFieldEditor
          key={field.id}
          blockId={selectedBlock.id}
          field={field}
          canEdit={canEdit}
          onUpdateField={onUpdateField}
        />
      ))}

      {textFields.length === 0 && assetFields.length === 0 && (
        <Alert severity="info">Este bloque no tiene campos editables.</Alert>
      )}

      {canEdit && (
        <>
          <Button
            variant="outlined"
            disabled={isSavingDraft}
            onClick={() => void onSaveDraft()}
          >
            {isSavingDraft ? 'Guardando...' : 'Guardar borrador'}
          </Button>
          {textFields.length > 0 && (
            <Button
              variant="outlined"
              color="secondary"
              disabled={isRegeneratingBlock}
              onClick={() => void onRegenerateBlock(selectedBlock.id)}
            >
              {isRegeneratingBlock ? 'Regenerando bloque...' : 'Regenerar este bloque con IA'}
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

function AssetFieldEditor({
  blockId,
  field,
  canEdit,
  onUpdateField,
}: {
  blockId: string
  field: NewsletterBlockField
  canEdit: boolean
  onUpdateField: Props['onUpdateField']
}) {
  const [assetType, setAssetType] = useState<SelectableAssetType>(
    field.keywordText !== null && field.keywordText !== undefined ? 'KEYWORD' : 'IMAGE',
  )
  const [assets, setAssets] = useState<UploadedAsset[]>([])
  const [isLoadingAssets, setIsLoadingAssets] = useState(false)
  const [assetListError, setAssetListError] = useState<string | null>(null)
  const [assetName, setAssetName] = useState('')
  const [assetDescription, setAssetDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let mounted = true

    const loadAssets = async (): Promise<void> => {
      setIsLoadingAssets(true)
      setAssetListError(null)

      try {
        const response = await listAssets(assetType)
        if (mounted) setAssets(response.assets)
      } catch (error) {
        if (!mounted) return

        setAssetListError(
          axios.isAxiosError(error)
            ? (error.response?.data?.message ?? 'No se pudieron obtener los assets.')
            : 'No se pudieron obtener los assets.',
        )
        setAssets([])
      } finally {
        if (mounted) setIsLoadingAssets(false)
      }
    }

    void loadAssets()

    return () => {
      mounted = false
    }
  }, [assetType])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const options = useMemo(() => {
    if (!field.assetId || assets.some((asset) => asset.id === field.assetId)) {
      return assets
    }

    return [
      {
        id: field.assetId,
        name: field.assetName ?? field.label,
        description: null,
        created_at: '',
        updated_at: '',
        url: field.assetUrl ?? '',
        type: assetType,
        keywordText: field.keywordText ?? null,
      },
      ...assets,
    ]
  }, [assetType, assets, field.assetId, field.assetName, field.assetUrl, field.keywordText, field.label])

  const selectedAsset = options.find((asset) => asset.id === field.assetId)
  const isKeyword = assetType === 'KEYWORD'

  const handleUpload = async (): Promise<void> => {
    setUploadError(null)
    setUploadProgress(0)

    if (!assetName.trim()) {
      setUploadError('El nombre del asset es obligatorio.')
      setUploadStatus('error')
      return
    }

    if (!selectedFile) {
      setUploadError('Selecciona un archivo para subir.')
      setUploadStatus('error')
      return
    }

    if (!uploadableMimeTypes.has(selectedFile.type)) {
      setUploadError('Solo se permiten imagenes JPG, PNG, WebP, GIF o SVG.')
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
        type: assetType,
        name: assetName.trim(),
        description: assetDescription.trim() || null,
        signal: abortController.signal,
        onUploadProgress: setUploadProgress,
      })

      setAssets((current) => [uploadedAsset, ...current.filter((asset) => asset.id !== uploadedAsset.id)])
      onUpdateField(blockId, field.id, {
        assetId: uploadedAsset.id,
        assetName: uploadedAsset.name,
        assetUrl: getPreviewUrl(uploadedAsset, field.keywordText),
        keywordText: assetType === 'KEYWORD' ? (field.keywordText ?? '') : null,
      })
      setUploadStatus('success')
      setUploadProgress(100)
      setSelectedFile(null)
      setAssetName('')
      setAssetDescription('')
    } catch (error) {
      if (axios.isCancel(error) || (error instanceof DOMException && error.name === 'AbortError')) {
        setUploadStatus('cancelled')
        setUploadError('Carga cancelada.')
        return
      }

      setUploadStatus('error')
      setUploadError(
        axios.isAxiosError(error)
          ? (error.response?.data?.message ?? 'No se pudo subir el asset.')
          : 'No se pudo subir el asset.',
      )
    } finally {
      abortControllerRef.current = null
    }
  }

  const cancelUpload = (): void => {
    abortControllerRef.current?.abort()
    setUploadStatus('cancelled')
    setUploadError('Carga cancelada.')
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">{field.label}</Typography>
      <FormControl fullWidth size="small" disabled={!canEdit}>
        <InputLabel id={`${field.id}-asset-type-label`}>Tipo de asset</InputLabel>
        <Select
          labelId={`${field.id}-asset-type-label`}
          label="Tipo de asset"
          value={assetType}
          onChange={(event: SelectChangeEvent<SelectableAssetType>) => {
            setAssetType(event.target.value as SelectableAssetType)
            onUpdateField(blockId, field.id, {
              assetId: null,
              assetName: null,
              assetUrl: null,
              keywordText: null,
            })
          }}
        >
          {selectableAssetTypes.map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {assetListError && <Alert severity="error">{assetListError}</Alert>}
      {isLoadingAssets && <Alert severity="info">Cargando assets...</Alert>}

      <FormControl fullWidth size="small" disabled={!canEdit || isLoadingAssets}>
        <InputLabel id={`${field.id}-asset-label`}>Asset</InputLabel>
        <Select
          labelId={`${field.id}-asset-label`}
          label="Asset"
          value={field.assetId ?? ''}
          renderValue={() =>
            selectedAsset ? <AssetPreview asset={selectedAsset} keywordText={field.keywordText} size="compact" /> : 'Sin asset'
          }
          onChange={(event: SelectChangeEvent<string>) => {
            const asset = options.find((option) => option.id === event.target.value)
            onUpdateField(blockId, field.id, {
              assetId: asset?.id ?? null,
              assetName: asset?.name ?? null,
              assetUrl: asset ? getPreviewUrl(asset, field.keywordText) : null,
              keywordText: assetType === 'KEYWORD' ? (field.keywordText ?? '') : null,
            })
          }}
        >
          <MenuItem value="">
            <em>Sin asset</em>
          </MenuItem>
          {options.map((asset) => (
            <MenuItem key={asset.id} value={asset.id}>
              <AssetPreview asset={asset} keywordText={field.keywordText} size="menu" />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {isKeyword && field.assetId && (
        <TextField
          label="Texto del keyword"
          value={field.keywordText ?? ''}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onUpdateField(blockId, field.id, {
              keywordText: event.target.value,
              assetUrl: selectedAsset
                ? getPreviewUrl(selectedAsset, event.target.value)
                : field.assetUrl,
            })
          }
          fullWidth
          size="small"
          disabled={!canEdit}
        />
      )}

      <Divider />
      <Typography variant="subtitle2">Subir asset</Typography>
      <TextField
        label="Nombre"
        value={assetName}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setAssetName(event.target.value)}
        fullWidth
        size="small"
        disabled={!canEdit || uploadStatus === 'uploading' || uploadStatus === 'compressing'}
      />
      <TextField
        label="Descripcion"
        value={assetDescription}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setAssetDescription(event.target.value)}
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
            {uploadStatus === 'compressing' ? 'Comprimiendo imagen...' : `Subiendo asset ${uploadProgress}%`}
          </Typography>
          <LinearProgress
            variant={uploadStatus === 'uploading' ? 'determinate' : 'indeterminate'}
            value={uploadProgress}
          />
          {uploadStatus === 'uploading' && (
            <Button variant="text" color="error" onClick={cancelUpload}>
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
  )
}

function AssetPreview({
  asset,
  keywordText,
  size,
}: {
  asset: UploadedAsset
  keywordText?: string | null
  size: 'compact' | 'menu'
}) {
  const width = size === 'compact' ? 84 : 128
  const height = size === 'compact' ? 44 : 72

  if (asset.type === 'KEYWORD' && asset.svgTemplate) {
    return (
      <AssetImageCard
        alt="Keyword"
        assetType={asset.type}
        svgTemplate={asset.svgTemplate}
        keywordText={keywordText ?? asset.keywordText}
        maxChars={asset.maxChars}
        readOnlyKeyword
        width={width}
        height={height}
      />
    )
  }

  return (
    <Box
      component="img"
      src={asset.url || undefined}
      alt=""
      sx={{
        width,
        height,
        objectFit: 'contain',
        bgcolor: 'lightgray',
      }}
    />
  )
}

function getPreviewUrl(asset: UploadedAsset, keywordText?: string | null): string {
  if (asset.type !== 'KEYWORD' || !asset.svgTemplate) {
    return asset.url
  }

  const markup = buildKeywordSvgMarkup(
    asset.svgTemplate,
    keywordText?.trim() || 'Editar',
    asset.id,
  )

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`
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
        if (blob) resolve(blob)
        else reject(new Error('No se pudo comprimir la imagen.'))
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
