import { useState } from 'react'
import {
  Typography, Chip, Button, Stack, Box
} from '@mui/material'
import {
  CheckCircleOutlined as UseIcon
} from '@mui/icons-material'
import { PreviewCanvas } from './canvas/PreviewCanvas'
import type { TemplateLayoutItem } from '../types/newsletter'

type StatusChipColor = 'default' | 'success' | 'warning'

const STATE_MAP: Record<string, { label: string; color: StatusChipColor }> = {
  ACTIVE: { label: 'Activa', color: 'success' },
  DRAFT: { label: 'Borrador', color: 'warning' },
}

interface TemplateCardProps {
  id: string
  name: string
  area_id: string
  state_code: string
  state_name: string
  description: string | null
  orientation: 'Portrait' | 'Landscape'
  layout: TemplateLayoutItem[] | null
  onPreview: (id: string) => void
  onSelect: (id: string) => void
}

export function TemplateCard({
  id, name, area_id, state_code, state_name, description, layout, onSelect
}: TemplateCardProps) {
  
  const isUsable = state_name === 'Activa';
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box 
      sx={{ 
        position: 'relative', 
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: 3
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* Background Preview */}
      <Box sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none', // Block interactions
      }}>
        {layout && layout.length > 0 ? (
          <Box sx={{ width: '100%' }}>
            <PreviewCanvas layout={layout} />
          </Box>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Vista previa no disponible
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        bgcolor: 'rgba(0, 0, 0, 0.75)',
        color: 'white',
        zIndex: 2,
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.25s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 5,
        textAlign: 'center'
      }}>
        <Stack spacing={2} sx={{ width: '100%', alignItems: 'center' }}>
          <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {name}
            </Typography>
            <Chip
              size="small"
              label={STATE_MAP[state_code]?.label ?? state_name}
              color={STATE_MAP[state_code]?.color ?? 'default'}
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Área: {area_id}
            </Typography>
            {description && (
              <Typography variant="body2" sx={{ 
                color: 'rgba(255,255,255,0.9)', 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
               }}>
                {description}
              </Typography>
            )}
          </Stack>
          <Stack spacing={1} sx={{ direction: 'row' }}>
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<UseIcon />}
              onClick={() => onSelect(id)}
              disabled={state_name !== 'Activa'}
              title={!isUsable ? 'Plantilla inactiva o no utilizable' : ''}
            >
              Usar
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}
