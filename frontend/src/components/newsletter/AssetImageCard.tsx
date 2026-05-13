import { Box, Card, CardActionArea, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

type AssetImageCardProps = {
  alt: string
  imageUrl: string
  isSelected?: boolean
  onClick?: () => void
  onRemove?: () => void
  width?: number
  height?: number
}

export function AssetImageCard({
  alt,
  imageUrl,
  isSelected = false,
  onClick,
  onRemove,
  width = 176,
  height = 112,
}: AssetImageCardProps) {
  const image = (
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
        width,
        position: 'relative',
        overflow: 'hidden',
        borderColor: isSelected ? 'primary.main' : 'divider',
        boxShadow: isSelected ? 3 : 0,
      }}
    >
      {onClick ? <CardActionArea onClick={onClick}>{image}</CardActionArea> : image}
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
