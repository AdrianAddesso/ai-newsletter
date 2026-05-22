import {
  Alert,
  Box,
  Button,
  Collapse,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import type { UploadedAsset } from '../../../api/assets'
import type { BrandKitResourceAsset, BrandKitResources } from '../../../api/brand-kits'
import { AssetImageCard } from './AssetImageCard'

const assetTypeLabels: Record<BrandKitResourceAsset["type"], string> = {
  IMAGE: "Imágenes",
  ICON: "Iconos",
  LOGO: "Logos",
  SHAPE: "Formas",
  LOCKUP: "Lockups",
  KEYWORD: "Keywords",
  BLOCK: "Blocks"
};

type Props = {
  selectedAssets: UploadedAsset[]
  resources: BrandKitResources | null
  isLoading: boolean
  loadError: string | null
  defaultCollapsed?: boolean
}

function groupAssetsByType(assets: BrandKitResourceAsset[]) {
  const groups = new Map<BrandKitResourceAsset['type'], BrandKitResourceAsset[]>()

  assets.forEach((asset) => {
    const currentAssets = groups.get(asset.type) ?? []
    currentAssets.push(asset)
    groups.set(asset.type, currentAssets)
  })

  return Array.from(groups.entries())
}

export function BrandKitResourcesPanel({
  selectedAssets,
  resources,
  isLoading,
  loadError,
  defaultCollapsed = true,
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const groupedBrandKitAssets = resources
    ? groupAssetsByType(resources.assets)
    : []

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6">Recursos del brandkit</Typography>
        <Button
          variant="text"
          size="small"
          onClick={() => setIsCollapsed((current) => !current)}
        >
          {isCollapsed ? 'Expandir' : 'Colapsar'}
        </Button>
      </Stack>

      <Collapse in={!isCollapsed}>
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography variant="subtitle2">Assets seleccionados</Typography>
            {selectedAssets.length > 0 ? (
              <Stack direction="row" spacing={1.25} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {selectedAssets.map((asset) => (
                  <AssetImageCard
                    key={asset.id}
                    alt={asset.name}
                    imageUrl={asset.url}
                    assetType={asset.type}
                    svgTemplate={asset.svgTemplate}
                    keywordText={asset.keywordText}
                    maxChars={asset.maxChars}
                    readOnlyKeyword
                    width={160}
                    height={104}
                  />
                ))}
              </Stack>
            ) : (
              <Alert severity="info">No seleccionaste assets al generar este newsletter.</Alert>
            )}
          </Stack>

          {isLoading && (
            <Alert severity="info">Cargando recursos del brandkit...</Alert>
          )}
          {loadError && <Alert severity="error">{loadError}</Alert>}

          {resources && (
            <>
          <Stack spacing={1}>
            <Typography variant="subtitle2">
              Assets del brandkit: {resources.brandKit.name}
            </Typography>
            {groupedBrandKitAssets.length > 0 ? (
              <Stack spacing={1.25}>
                {groupedBrandKitAssets.map(([type, assets]) => (
                  <Stack spacing={0.75} key={type}>
                    <Typography variant="body2" color="text.secondary">
                      {assetTypeLabels[type]}
                    </Typography>
                    <Stack direction="row" spacing={1.25} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      {assets.map((asset) => (
                        <AssetImageCard
                          key={asset.id}
                          alt={asset.name}
                          imageUrl={asset.url}
                          assetType={asset.type}
                          svgTemplate={asset.svgTemplate}
                          keywordText={asset.keywordText}
                          maxChars={asset.maxChars}
                          readOnlyKeyword
                          width={160}
                          height={104}
                        />
                      ))}
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Alert severity="info">Este brandkit no tiene assets asociados.</Alert>
            )}
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">Tipografías disponibles</Typography>
            {resources.fonts.length > 0 ? (
              <Stack spacing={1}>
                {resources.fonts.map((font) => (
                  <Paper key={font.id} variant="outlined" sx={{ p: 1.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {font.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {font.style} · {font.groupName}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Alert severity="info">Este brandkit no tiene tipografías disponibles.</Alert>
            )}
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">Colores del brandkit</Typography>
            {resources.colors.length > 0 ? (
              <Stack direction="row" spacing={1.25} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {resources.colors.map((color) => (
                  <Paper
                    key={color.id}
                    variant="outlined"
                    sx={{ p: 1.25, width: 152 }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        height: 36,
                        borderRadius: 1,
                        bgcolor: color.hex,
                        border: '1px solid',
                        borderColor: 'divider',
                        mb: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {color.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {color.hex}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Alert severity="info">Este brandkit no tiene colores configurados.</Alert>
            )}
          </Stack>
            </>
          )}
        </Stack>
      </Collapse>
    </Stack>
  )
}
