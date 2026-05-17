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
import type { AssetType } from '../../api/assets'
import { KEYWORD_MAX_CHARS } from '../../../../packages/shared/src/enums/assets-config'

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
  width?: number
  height?: number
}

const svgNamespace = 'http://www.w3.org/2000/svg'
const keywordTextAttributes = {
  id: 'editable-text',
  class: 'cls-1',
  x: '443.585',
  y: '78.08',
  'text-anchor': 'middle',
  'dominant-baseline': 'middle',
  'font-family': 'system-ui, sans-serif',
  'font-size': '56',
  'font-weight': '700',
} as const

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function ensureKeywordTextNode(document: XMLDocument): Element | null {
  const existingTextNode = document.querySelector('#editable-text')

  if (existingTextNode) {
    return existingTextNode
  }

  const textGroup = document.querySelector('#Text')

  if (!textGroup) {
    return null
  }

  const createdTextNode = document.createElementNS(svgNamespace, 'text')

  Object.entries(keywordTextAttributes).forEach(([attributeName, attributeValue]) => {
    createdTextNode.setAttribute(attributeName, attributeValue)
  })

  while (textGroup.firstChild) {
    textGroup.removeChild(textGroup.firstChild)
  }

  textGroup.appendChild(createdTextNode)
  return createdTextNode
}

function namespaceSvgDocument(document: XMLDocument, suffix: string): void {
  const idMap = new Map<string, string>()
  const classNames = new Set<string>()

  document.querySelectorAll('[id]').forEach((element) => {
    const currentId = element.getAttribute('id')

    if (!currentId) {
      return
    }

    const nextId = `${currentId}-${suffix}`
    idMap.set(currentId, nextId)
    element.setAttribute('id', nextId)
  })

  document.querySelectorAll('[class]').forEach((element) => {
    const classAttribute = element.getAttribute('class')

    if (!classAttribute) {
      return
    }

    const namespacedClasses = classAttribute
      .split(/\s+/)
      .filter(Boolean)
      .map((className) => {
        classNames.add(className)
        return `${className}-${suffix}`
      })

    element.setAttribute('class', namespacedClasses.join(' '))
  })

  document.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      let nextValue = attribute.value

      idMap.forEach((nextId, currentId) => {
        nextValue = nextValue.replaceAll(`url(#${currentId})`, `url(#${nextId})`)

        if (nextValue === `#${currentId}`) {
          nextValue = `#${nextId}`
        }
      })

      if (nextValue !== attribute.value) {
        element.setAttribute(attribute.name, nextValue)
      }
    })
  })

  document.querySelectorAll('style').forEach((styleElement) => {
    const styleContent = styleElement.textContent

    if (!styleContent) {
      return
    }

    let nextStyleContent = styleContent

    classNames.forEach((className) => {
      nextStyleContent = nextStyleContent.replace(
        new RegExp(`\\.${escapeRegExp(className)}(?![a-zA-Z0-9_-])`, 'g'),
        `.${className}-${suffix}`,
      )
    })

    styleElement.textContent = nextStyleContent
  })
}

function buildKeywordSvgMarkup(
  svgTemplate: string,
  value: string,
  uniqueId: string,
): string {
  const normalizedUniqueId =
    uniqueId
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'keyword'

  const parser = new DOMParser()
  const document = parser.parseFromString(svgTemplate, 'image/svg+xml')
  const parserError = document.querySelector('parsererror')

  if (parserError) {
    return svgTemplate
  }

  const editableTextNode = ensureKeywordTextNode(document)

  if (editableTextNode) {
    editableTextNode.textContent = value
  }

  namespaceSvgDocument(document, normalizedUniqueId)

  return new XMLSerializer().serializeToString(document)
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
  const effectiveKeywordWidth = Math.max(
    width,
    Math.min(420, 148 + keywordPreviewText.length * 10),
  )
  const keywordSvgMarkup = useMemo(() => {
    if (!isKeywordAsset) {
      return null
    }

    return buildKeywordSvgMarkup(svgTemplate, keywordPreviewText, alt)
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
        width: isKeywordAsset ? effectiveKeywordWidth : width,
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
