import {
  Card, CardContent, CardActions, CardMedia,
  Typography, Chip, Button, Box, Stack
} from '@mui/material'
import {
  VisibilityOutlined as ViewIcon,
  CheckCircleOutlined as UseIcon
} from '@mui/icons-material'

type StatusChipColor = 'default' | 'success' | 'warning'

const STATE_MAP: Record<string, { label: string; color: StatusChipColor }> = {
  'state_1': { label: 'Publicado', color: 'success' },
  'state_2': { label: 'En borrador', color: 'warning' },
  'state_3': { label: 'Publicado', color: 'success' },
}

interface TemplateCardProps {
  id: string
  name: string
  area_id: string
  state_id: string
  description: string
  orientation: 'Portrait' | 'Landscape'
  onPreview: (id: string) => void
  onSelect: (id: string) => void
}

export function TemplateCard({
  id, name, area_id, state_id, description, orientation, onPreview, onSelect
}: TemplateCardProps) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Thumbnail placeholder */}
      <CardMedia sx={{
        height: orientation === 'Portrait' ? 280 : 160,
        bgcolor: 'action.hover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="caption" color="text.secondary">
          Vista previa no disponible
        </Typography>
      </CardMedia>

      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={1}>

          {/* Nombre y estado */}
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {name}
            </Typography>
            <Chip
              size="small"
              label={STATE_MAP[state_id]?.label}
              color={STATE_MAP[state_id]?.color ?? 'default'}
            />
          </Stack>

          {/* Area */}
          <Typography variant="caption" color="text.secondary">
            Área: {area_id}
          </Typography>

          {/* Descripción */}
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>

        </Stack>
      </CardContent>

      {/* Botones */}
      <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ViewIcon />}
          onClick={() => onPreview(id)}
          fullWidth
        >
          Vista previa
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<UseIcon />}
          onClick={() => onSelect(id)}
          fullWidth
        >
          Usar
        </Button>
      </CardActions>

    </Card>
  )
}