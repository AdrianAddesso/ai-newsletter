import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  SaveOutlined as SaveIcon,
} from '@mui/icons-material'
import { useNavigate, useSearchParams } from 'react-router'
import {
  createBrandKit,
  createBrandKitColor,
  deleteBrandKitColor,
  deleteBrandKitFont,
  getBrandKit,
  getBrandKitResources,
  updateBrandKit,
  updateBrandKitColor,
  updateBrandKitFont,
  uploadBrandKitFonts,
} from '../../api/brand-kits'
import { BrandInfo } from '../../components/admin/branding/BrandInfo'
import type { BrandInfoValues } from '../../components/admin/branding/BrandInfo'
import { ColorList, type Color } from '../../components/admin/branding/ColorList'
import {
  TypographyList,
  type FontEntry,
} from '../../components/admin/branding/TypographyList'
import { AssetsList } from '../../components/admin/assets/AssetsList'
import { useNotification } from '../../hooks/useNotification'

export function BrandkitPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const brandkitId = searchParams.get('id')
  const isEditing = Boolean(brandkitId)
  const { error: notifyError, success } = useNotification()

  const [brandInfo, setBrandInfo] = useState<BrandInfoValues>({
    name: '',
    active: false,
  })
  const [colors, setColors] = useState<Color[]>([])
  const [fonts, setFonts] = useState<FontEntry[]>([])
  const [errors, setErrors] = useState<
    Partial<Record<keyof BrandInfoValues, string>>
  >({})
  const [isLoading, setIsLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    if (!brandkitId) {
      return
    }

    let mounted = true

    const loadBrandKit = async (): Promise<void> => {
      setIsLoading(true)

      try {
        const [brandKit, resources] = await Promise.all([
          getBrandKit(brandkitId),
          getBrandKitResources(brandkitId),
        ])

        if (!mounted) {
          return
        }

        setBrandInfo({
          name: brandKit.name,
          active: brandKit.active,
        })
        setColors(resources.colors)
        setFonts(resources.fonts)
      } catch (loadError) {
        console.error('Error loading brand kit page:', loadError)
        notifyError('No se pudo cargar el brandkit.')
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadBrandKit()

    return () => {
      mounted = false
    }
  }, [brandkitId, notifyError])

  const validate = (): boolean => {
    const nextErrors: typeof errors = {}

    if (!brandInfo.name.trim()) {
      nextErrors.name = 'El nombre del brandkit es obligatorio.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async (): Promise<void> => {
    if (!validate()) {
      return
    }

    setSaving(true)

    try {
      if (brandkitId) {
        await updateBrandKit(brandkitId, {
          name: brandInfo.name.trim(),
          active: brandInfo.active,
        })

        success('Brandkit actualizado correctamente.')
        return
      }

      const createdBrandKit = await createBrandKit({
        name: brandInfo.name.trim(),
        active: brandInfo.active,
      })

      success('Brandkit creado correctamente.')
      navigate(`/admin/brandkit?id=${createdBrandKit.id}`, { replace: true })
    } catch (saveError) {
      console.error('Error saving brand kit:', saveError)
      notifyError('Ocurrio un error al guardar el brandkit.')
      setSnackbar({
        open: true,
        message: 'Ocurrio un error al guardar el brandkit. Intenta de nuevo.',
        severity: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const requireBrandKitId = (): string => {
    if (!brandkitId) {
      throw new Error('Brand kit id is required for resource management')
    }

    return brandkitId
  }

  const handleCreateColor = async (
    data: Pick<Color, 'name' | 'hex'>,
  ): Promise<void> => {
    const nextColor = await createBrandKitColor(requireBrandKitId(), data)
    setColors((current) => [...current, nextColor].sort((left, right) => left.name.localeCompare(right.name)))
    success('Color agregado correctamente.')
  }

  const handleUpdateColor = async (
    colorId: string,
    data: Pick<Color, 'name' | 'hex'>,
  ): Promise<void> => {
    const updatedColor = await updateBrandKitColor(requireBrandKitId(), colorId, data)
    setColors((current) =>
      current
        .map((color) => (color.id === colorId ? updatedColor : color))
        .sort((left, right) => left.name.localeCompare(right.name)),
    )
    success('Color actualizado correctamente.')
  }

  const handleDeleteColor = async (colorId: string): Promise<void> => {
    await deleteBrandKitColor(requireBrandKitId(), colorId)
    setColors((current) => current.filter((color) => color.id !== colorId))
    success('Color eliminado correctamente.')
  }

  const handleUploadFonts = async (files: File[]): Promise<void> => {
    const response = await uploadBrandKitFonts(requireBrandKitId(), files)
    setFonts((current) =>
      [...current, ...response.fonts].sort((left, right) => left.name.localeCompare(right.name)),
    )
    success('Fuente cargada correctamente.')
  }

  const handleUpdateFont = async (
    fontId: string,
    data: { name: string; style: string },
  ): Promise<void> => {
    const updatedFont = await updateBrandKitFont(requireBrandKitId(), fontId, data)
    setFonts((current) =>
      current
        .map((font) => (font.id === fontId ? updatedFont : font))
        .sort((left, right) => left.name.localeCompare(right.name)),
    )
    success('Fuente actualizada correctamente.')
  }

  const handleDeleteFont = async (fontId: string): Promise<void> => {
    await deleteBrandKitFont(requireBrandKitId(), fontId)
    setFonts((current) => current.filter((font) => font.id !== fontId))
    success('Fuente eliminada correctamente.')
  }

  return (
    <Box
      sx={{
        py: 0,
        px: 3,
        bgcolor: 'background.default',
        height: '100vh',
        overflowY: 'auto',
        scrollbarGutter: 'stable',
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Stack spacing={3}>
          <Stack
            data-onboarding="brandkit-header"
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
            }}
          >
            <Stack spacing={0}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Button
                  size="small"
                  startIcon={<BackIcon />}
                  onClick={() => navigate('/admin')}
                  sx={{ color: 'text.secondary' }}
                >
                  Volver al panel de administracion
                </Button>
              </Stack>
              <Typography variant="h2">
                {isEditing ? 'Editar Brandkit' : 'Nuevo Brandkit'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isEditing
                  ? 'Modifica la informacion, colores y fuentes del brandkit.'
                  : 'Configura un nuevo brandkit para tus newsletters.'}
              </Typography>
            </Stack>

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => void handleSave()}
              disabled={saving || isLoading}
              sx={{
                whiteSpace: 'nowrap',
                alignSelf: { xs: 'flex-start', sm: 'center' },
              }}
            >
              {saving
                ? 'Guardando...'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Crear brandkit'}
            </Button>
          </Stack>

          {isLoading ? (
            <Alert severity="info">Cargando configuracion del brandkit...</Alert>
          ) : null}

          <Stack data-onboarding="brandkit-resources" spacing={3}>
            <BrandInfo values={brandInfo} onChange={setBrandInfo} errors={errors} />

            <TypographyList
              fonts={fonts}
              isLoading={isLoading}
              isDisabled={!brandkitId}
              onUploadFonts={handleUploadFonts}
              onUpdateFont={handleUpdateFont}
              onDeleteFont={handleDeleteFont}
            />

            <ColorList
              colors={colors}
              isLoading={isLoading}
              isDisabled={!brandkitId}
              onCreateColor={handleCreateColor}
              onUpdateColor={handleUpdateColor}
              onDeleteColor={handleDeleteColor}
            />

            <Box>
            <Stack spacing={1} sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Assets del brandkit</Typography>
              <Typography variant="body2" color="text.secondary">
                Imagenes y archivos asociados a este brandkit.
              </Typography>
            </Stack>
            <AssetsList brandId={brandkitId ?? undefined} compact />
            </Box>
          </Stack>

          <Box
            sx={{
              position: 'sticky',
              bottom: 16,
              display: 'flex',
              justifyContent: 'flex-end',
              pt: 2,
            }}
          >
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={() => navigate('/admin')}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => void handleSave()}
                disabled={saving || isLoading}
              >
                {saving
                  ? 'Guardando...'
                  : isEditing
                    ? 'Guardar cambios'
                    : 'Crear brandkit'}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
