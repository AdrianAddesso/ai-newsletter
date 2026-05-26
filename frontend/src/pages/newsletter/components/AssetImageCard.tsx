import { useMemo } from 'react'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import type { AssetType } from '../../../api/assets'
import { KEYWORD_MAX_CHARS } from '@shared/enums/assets-config'
import { buildKeywordSvgMarkup } from '../utils/keywordSvg'

type AssetImageCardProps = {
  alt: string
  imageUrl?: string
  assetType?: AssetType
  svgTemplate?: string | null
  keywordText?: string | null
  maxChars?: number | null
  isKeywordEditing?: boolean
  readOnlyKeyword?: boolean
  onKeywordTextChange?: (value: string) => void
  isSelected?: boolean
  onClick?: () => void
  onRemove?: () => void
  width?: number | string
  height?: number
}

function getKeywordPreviewText(keywordText?: string | null): string {
  return keywordText?.trim() || 'Editar'
}

export function AssetImageCard({
  alt,
  imageUrl,
  assetType,
  svgTemplate,
  keywordText,
  maxChars,
  isKeywordEditing = false,
  readOnlyKeyword = false,
  onKeywordTextChange,
  isSelected = false,
  onClick,
  onRemove,
  width = 200,
  height = 112,
}: AssetImageCardProps) {
  const isKeywordAsset = assetType === 'KEYWORD' && !!svgTemplate
  const keywordPreviewText = getKeywordPreviewText(keywordText)
  const isFluidWidth = typeof width === 'string'
  const effectiveKeywordWidth = Math.max(
    isFluidWidth ? 0 : width,
    Math.min(420, 148 + keywordPreviewText.length * 10),
  )
  const keywordSvgMarkup = useMemo(() => {
    if (!isKeywordAsset) {
      return null
    }

    // Use a stable unique id derived from the SVG template so each
    // keyword SVG gets its own namespace. Previously `alt` was used
    // (often the literal "Keyword") which produced identical
    // suffixes and caused all inline SVG style rules to collide.
    function hashString(s: string): number {
      let h = 5381
      for (let i = 0; i < s.length; i++) {
        h = (h * 33) ^ s.charCodeAt(i)
      }
      return h >>> 0
    }

    const svgHash = hashString(svgTemplate ?? '')
    const uniqueId = `${alt}-${svgHash.toString(36)}`

    return buildKeywordSvgMarkup(svgTemplate, keywordPreviewText, uniqueId)
  }, [alt, isKeywordAsset, keywordPreviewText, svgTemplate])

  const preview = isKeywordAsset ? (
    <Box sx={{ px: 1.5, pt: 1.5 }}>
      <Box
        role="img"
        aria-label={alt}
        sx={{
          width: '100%',
          minHeight: 72,
          '& svg': {
            width: '100%',
            height: 'auto',
            display: 'block',
          },
        }}
        dangerouslySetInnerHTML={{
          __html: keywordSvgMarkup ?? '',
        }}
      />
    </Box>
  ) : (
    <Box
      component="img"
      src={imageUrl}
      alt={alt}
      sx={{
        width: '100%',
        height,
        objectFit: 'cover',
        display: 'block',
        bgcolor: 'grey.100',
      }}
    />
  )

  return (
    <Card
      variant="outlined"
      sx={{
        width: isFluidWidth
          ? width
          : isKeywordAsset
            ? effectiveKeywordWidth
            : width,
        position: 'relative',
        overflow: 'hidden',
        borderColor: isSelected ? 'primary.main' : 'divider',
        boxShadow: isSelected ? 3 : 0,
      }}
    >
      {onClick ? <CardActionArea onClick={onClick}>{preview}</CardActionArea> : preview}
      {isKeywordAsset && isKeywordEditing && !readOnlyKeyword && onKeywordTextChange && (
        <CardContent sx={{ pt: 1, '&:last-child': { pb: 2 } }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Texto del keyword"
            value={keywordText ?? ''}
            onChange={(event) => onKeywordTextChange(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            slotProps={{
              htmlInput: {
                maxLength: maxChars ?? KEYWORD_MAX_CHARS,
              },
            }}
            helperText={`${(keywordText ?? '').length}/${maxChars ?? KEYWORD_MAX_CHARS}`}
          />
        </CardContent>
      )}
      {isKeywordAsset && !isKeywordEditing && !readOnlyKeyword && (
        <Box sx={{ px: 1.5, pb: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            Hacé click para editar el texto.
          </Typography>
        </Box>
      )}
      {onRemove && (
        <IconButton
          size="small"
          aria-label={`Quitar ${alt}`}
          onClick={onRemove}
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            bgcolor: 'rgba(255,255,255,0.92)',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,1)',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Card>
  )
}
