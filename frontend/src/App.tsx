import './App.css'
<<<<<<< HEAD

// Legacy demo pages
import axios from 'axios'
import { useMemo, useState } from 'react'
import {
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import EditNewsletterPage from './pages/EditNewsletterPage'

type DemoPage = 'assets' | 'colors' | 'typography' | 'components'

type Swatch = {
  name: string
  value: string
  text?: string
}

type ApiHealth = {
  ok: boolean
  service: string
  timestamp: string
}

const pageTabs: Array<{ id: DemoPage; label: string }> = [
  { id: 'assets', label: 'Assets' },
  { id: 'colors', label: 'Color' },
  { id: 'typography', label: 'Tipografia' },
  { id: 'components', label: 'Componentes' },
]

const sampleText =
  'Historias internas claras, consistentes y listas para publicarse.'

function getContrastColor(hex: string) {
  const clean = hex.replace('#', '')
  const red = parseInt(clean.slice(0, 2), 16)
  const green = parseInt(clean.slice(2, 4), 16)
  const blue = parseInt(clean.slice(4, 6), 16)
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255

  return luminance > 0.62 ? '#30261D' : '#FFFFFF'
}

function TokenSwatch({ name, value, text }: Swatch) {
  const textColor = text ?? getContrastColor(value)

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          bgcolor: value,
          color: textColor,
          minHeight: 112,
          p: 2,
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <Typography variant="overline">{name}</Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">{value}</Typography>
      </Box>
    </Paper>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <Stack spacing={1.25} sx={{ maxWidth: 760 }}>
      <Typography variant="overline">{eyebrow}</Typography>
      <Typography variant="h2">{title}</Typography>
      <Typography variant="body1" color="text.secondary">
        {description}
      </Typography>
    </Stack>
  )
}

function SwatchGrid({ swatches }: { swatches: Swatch[] }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 1fr))',
        },
        gap: 2,
      }}
    >
      {swatches.map((swatch) => (
        <TokenSwatch key={`${swatch.name}-${swatch.value}`} {...swatch} />
      ))}
    </Box>
  )
}

function BackendConnectionDemo() {
  const [health, setHealth] = useState<ApiHealth | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get<ApiHealth>('/health')
      setHealth(response.data)
    } catch (connectionError) {
      setHealth(null)
      setError(
        connectionError instanceof Error
          ? connectionError.message
          : 'No se pudo conectar con el backend',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: error ? 'error.main' : 'divider',
        p: 3,
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
          }}
        >
          <Stack spacing={0.75}>
            <Typography variant="overline">Backend connection</Typography>
            <Typography variant="h4">Axios health check</Typography>
            <Typography variant="body2" color="text.secondary">
              API base: {apiBaseUrl}
            </Typography>
          </Stack>
          <Button variant="contained" color="secondary" onClick={testConnection} disabled={loading}>
            {loading ? 'Conectando' : 'Probar conexion'}
          </Button>
        </Stack>

        {health && (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Chip label="Backend online" color="success" />
            <Typography variant="body2">{health.service}</Typography>
            <Typography variant="body2" color="text.secondary">
              {health.timestamp}
            </Typography>
          </Stack>
        )}

        {error && (
          <Typography variant="body2" color="error.main">
            {error}
          </Typography>
        )}
      </Stack>
    </Paper>
  )
}

function AssetsPage() {
  const theme = useTheme()

  return (
    <Stack spacing={5}>
      <SectionHeader
        eyebrow="Theme assets"
        title="Logos disponibles para paginas"
        description="El theme registra los dos logos blancos pensados para fondos de color: firma completa para layouts amplios y Nest para espacios restringidos."
      />

      <BackendConnectionDemo />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            bgcolor: 'brand.red',
            color: 'brand.white',
            p: { xs: 3, md: 4 },
            minHeight: 260,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box
            component="img"
            src={theme.nestle.assets.logos.signatureWhite}
            alt="Nestle Good Food Good Life"
            sx={{ width: 230 }}
          />
          <Stack spacing={1}>
            <Typography variant="h4">Firma completa</Typography>
            <Typography variant="body1">
              Para headers, footers y paginas con suficiente ancho.
            </Typography>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            bgcolor: 'brand.purpleDark',
            color: 'brand.white',
            p: { xs: 3, md: 4 },
            minHeight: 260,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box
            component="img"
            src={theme.nestle.assets.logos.nestWhite}
            alt="Nestle"
            sx={{ width: 126 }}
          />
          <Stack spacing={1}>
            <Typography variant="h4">Nest restringido</Typography>
            <Typography variant="body1">
              Para formatos reducidos, barras compactas o modulos estrechos.
            </Typography>
          </Stack>
        </Paper>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h3">Tokens de pagina</Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            <Stack spacing={0.5}>
              <Typography variant="caption">maxWidth</Typography>
              <Typography variant="h5">{theme.nestle.page.maxWidth}px</Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption">padding X</Typography>
              <Typography variant="h5">
                xs {theme.nestle.page.sectionPaddingX.xs} / md{' '}
                {theme.nestle.page.sectionPaddingX.md}
              </Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption">padding Y</Typography>
              <Typography variant="h5">
                xs {theme.nestle.page.sectionPaddingY.xs} / md{' '}
                {theme.nestle.page.sectionPaddingY.md}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  )
}

function ColorsPage() {
  const theme = useTheme()

  const primarySwatches = useMemo<Swatch[]>(
    () => [
      { name: 'red', value: theme.palette.brand.red },
      { name: 'darkOak', value: theme.palette.brand.darkOak },
      { name: 'white', value: theme.palette.brand.white, text: theme.palette.brand.darkOak },
    ],
    [theme],
  )

  const backgroundSwatches = useMemo<Swatch[]>(
    () =>
      Object.entries(theme.palette.brand.backgroundsWithText).map(([name, value]) => ({
        name,
        value,
      })),
    [theme],
  )

  const keywordSwatches = useMemo<Swatch[]>(
    () =>
      Object.entries(theme.palette.brand.keywordFills).map(([name, value]) => ({
        name,
        value,
        text: theme.palette.brand.darkOak,
      })),
    [theme],
  )

  const shapeSwatches = useMemo<Swatch[]>(
    () =>
      Object.entries(theme.palette.brand.shapeFills).map(([name, value]) => ({
        name,
        value,
      })),
    [theme],
  )

  return (
    <Stack spacing={6}>
      <SectionHeader
        eyebrow="Palette"
        title="Colores definidos en MUI"
        description="La paleta separa colores primarios, fondos con texto, keywords y shapes para que cada pagina use el token correcto."
      />

      <Stack spacing={2}>
        <Typography variant="h3">Primarios</Typography>
        <SwatchGrid swatches={primarySwatches} />
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h3">Fondos con texto</Typography>
        <SwatchGrid swatches={backgroundSwatches} />
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h3">Keywords</Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
            gap: 2,
          }}
        >
          {keywordSwatches.map((swatch) => {
            const shadow =
              theme.palette.brand.keywordShadows[
              swatch.name as keyof typeof theme.palette.brand.keywordShadows
              ]

            return (
              <Paper
                key={swatch.name}
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 3,
                  minHeight: 128,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Chip
                  label={swatch.name.toUpperCase()}
                  sx={{
                    bgcolor: swatch.value,
                    color: 'brand.darkOak',
                    boxShadow: `5px 5px 0 ${shadow}`,
                  }}
                />
              </Paper>
            )
          })}
        </Box>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h3">Shapes</Typography>
        <SwatchGrid swatches={shapeSwatches} />
      </Stack>
    </Stack>
  )
}

function TypographyPage() {
  const theme = useTheme()

  const fontRows = [
    {
      name: 'Body',
      family: theme.nestle.fonts.body,
      usage: 'Texto regular de pagina',
      sample: sampleText,
    },
    {
      name: 'Title',
      family: theme.nestle.fonts.title,
      usage: 'Titulos, keywords y llamadas cortas',
      sample: 'TRANSFORM COLLABORATIVE PROUD',
    },
    {
      name: 'Emphasis',
      family: theme.nestle.fonts.emphasis,
      usage: 'Frases destacadas y lockups de empleado',
      sample: 'Mensajes que necesitan mayor presencia.',
    },
    {
      name: 'Light',
      family: theme.nestle.fonts.light,
      usage: 'Apoyo visual de baja densidad',
      sample: 'Informacion secundaria con lectura limpia.',
    },
  ]

  const variants = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'body1', 'body2', 'button'] as const

  return (
    <Stack spacing={6}>
      <SectionHeader
        eyebrow="Typography"
        title="Familias y variantes"
        description="Las variantes de MUI ya apuntan a las fuentes Nestle cargadas por CssBaseline."
      />

      <Stack spacing={2}>
        {fontRows.map((row) => (
          <Paper
            key={row.name}
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}
          >
            <Stack spacing={2}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1}
                sx={{ justifyContent: 'space-between' }}
              >
                <Typography variant="overline">{row.name}</Typography>
                <Typography variant="caption">{row.usage}</Typography>
              </Stack>
              <Typography
                sx={{
                  fontFamily: `"${row.family}", Arial, sans-serif`,
                  fontSize: '2rem',
                  lineHeight: 1.1,
                  fontWeight: row.name === 'Body' || row.name === 'Light' ? 400 : 700,
                }}
              >
                {row.sample}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {row.family}
              </Typography>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h3">Variantes MUI</Typography>
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
          <Stack divider={<Divider flexItem />} spacing={2.5}>
            {variants.map((variant) => (
              <Stack key={variant} spacing={1}>
                <Typography variant="caption">{variant}</Typography>
                <Typography variant={variant}>
                  {variant === 'button' ? 'Boton de accion' : sampleText}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Stack>
    </Stack>
  )
}

function ComponentsPage() {
  const theme = useTheme()

  return (
    <Stack spacing={6}>
      <SectionHeader
        eyebrow="Components"
        title="Overrides base"
        description="Botones, chips, links, paper y cards comparten radios compactos, tipografia de marca y colores definidos en el theme."
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h4">Botones</Typography>
            <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Button variant="contained" color="primary">
                Primario
              </Button>
              <Button variant="contained" color="secondary">
                Secundario
              </Button>
              <Button variant="outlined">Outline</Button>
              <Button variant="text">Texto</Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h4">Keywords</Typography>
            <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {Object.entries(theme.palette.brand.keywordFills).slice(0, 4).map(([name, color]) => (
                <Chip
                  key={name}
                  label={name.toUpperCase()}
                  sx={{
                    bgcolor: color,
                    color: 'brand.darkOak',
                    boxShadow: `4px 4px 0 ${theme.palette.brand.keywordShadows[
                      name as keyof typeof theme.palette.brand.keywordShadows
                    ]
                      }`,
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Paper>
      </Box>

      <Paper
        elevation={0}
        sx={{
          bgcolor: 'brand.greenDark',
          color: 'brand.white',
          p: { xs: 3, md: 5 },
        }}
      >
        <Stack spacing={3} sx={{ maxWidth: 760 }}>
          <Box
            component="img"
            src={theme.nestle.assets.logos.signatureWhite}
            alt="Nestle Good Food Good Life"
            sx={{ width: 210 }}
          />
          <Typography variant="h2">Bloque editorial de pagina</Typography>
          <Typography variant="body1">
            Un ejemplo de seccion con fondo oscuro, logo blanco, titulo condensado y
            texto con contraste correcto.
          </Typography>
          <Button variant="contained" color="warning" sx={{ alignSelf: 'flex-start' }}>
            Leer historia
          </Button>
        </Stack>
      </Paper>
    </Stack>
  )
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState<DemoPage>('assets')
  const theme = useTheme()

  const pageContent = {
    assets: <AssetsPage />,
    colors: <ColorsPage />,
    typography: <TypographyPage />,
    components: <ComponentsPage />,
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Box
        sx={{
          bgcolor: 'brand.red',
          color: 'brand.white',
          px: theme.nestle.page.sectionPaddingX,
          py: { xs: 3, md: 4 },
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Stack spacing={3}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
              }}
            >
              <Box
                component="img"
                src={theme.nestle.assets.logos.signatureWhite}
                alt="Nestle Good Food Good Life"
                sx={{ width: 210 }}
              />
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {pageTabs.map((page) => (
                  <Button
                    key={page.id}
                    variant={currentPage === page.id ? 'contained' : 'outlined'}
                    color={currentPage === page.id ? 'warning' : 'inherit'}
                    onClick={() => setCurrentPage(page.id)}
                    sx={{
                      color: currentPage === page.id ? 'brand.darkOak' : 'brand.white',
                      borderColor: 'currentColor',
                    }}
                  >
                    {page.label}
                  </Button>
                ))}
              </Stack>
            </Stack>

            <Stack spacing={1.5} sx={{ maxWidth: 820 }}>
              <Typography variant="h1">Demo visual del theme Nestle</Typography>
              <Typography variant="subtitle1">
                Assets, paleta, tipografia y componentes listos para construir paginas.
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box
        sx={{
          px: theme.nestle.page.sectionPaddingX,
          py: theme.nestle.page.sectionPaddingY,
        }}
      >
        <Container maxWidth="lg" disableGutters>
          {pageContent[currentPage]}
        </Container>
      </Box>
    </Box>
  )
}

function AppRouter() {
  const { notifications, removeNotification } = useNotification()

  return (
    <Box sx={{ position: "relative" }}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/demo" element={<AppContent />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <DashboardPage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/crearNewsletter"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <CreatePage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/editarTemplate/:id"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <EditPage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/editarNewsletter/:id"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <EditNewsletterPage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "FUNCTIONAL"]}>
                <ProtectedLayout>
                  <TemplatesPage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "FUNCTIONAL"]}>
                <ProtectedLayout>
                  <AnalyticsPage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'FUNCTIONAL']}>
                <ProtectedLayout>
                  <ReviewsPage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <ProtectedLayout>
                  <UsersPage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <SettingsPage />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/newsletters/edit/:id"
            element={
              <h1 className="titulo-templates">
                Página de newsletters por ID en construcción
              </h1>
            }
          />
          <Route
            path="/reviews/:id"
            element={
              <h1 className="titulo-templates">
                Página de reviews por newsletter id en construcción
              </h1>
            }
          />
          <Route
            path="/admin/templates"
            element={
              <h1 className="titulo-templates">
                Página de templates SUPER ADMIN en construcción
              </h1>
            }
          />
          <Route
            path="/admin/templates/create"
            element={
              <h1 className="titulo-templates">
                Página de templates creación SUPER ADMIN en construcción
              </h1>
            }
          />
          <Route
            path="/admin/templates/edit/:id"
            element={
              <h1 className="titulo-templates">
                Página de templates edición SUPER ADMIN en construcción
              </h1>
            }
          />
          <Route
            path="/newsletters/preview/:id"
            element={
              <h1 className="titulo-templates">
                Página de newsletters preview en construcción
              </h1>
            }
          />
          <Route
            path="/logs"
            element={
              <h1 className="titulo-templates">
                Página de logs en construcción
              </h1>
            }
          />
          <Route
            path="/backoffice"
            element={
              <h1 className="titulo-templates">
                Página de backoffice en construcción
              </h1>
            }
          />
          <Route
            path="/branding"
            element={
              <h1 className="titulo-templates">
                Página de branding en construcción
              </h1>
            }
          />
          {/* Redirect to login by default */}
          <Route path="/" element={<LoginPage />} />
        </Routes>
      </Router>

      {/* Global notification manager */}
      <NotificationManager
        notifications={notifications}
        onClose={removeNotification}
      />
    </Box>
  );
}
=======
import { AppProviders } from './app/AppProviders'
import { AppRouter } from './app/AppRouter'
>>>>>>> 496d50088dde3f03be96b6688900121ed28869f9

function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}

export default App