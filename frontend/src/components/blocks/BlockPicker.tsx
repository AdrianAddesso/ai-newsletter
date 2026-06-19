import {Box,Card,CardContent,Typography, CardMedia,} from "@mui/material";
import type { ReactElement } from 'react'
import { useBlockDefinitions } from '../../hooks/useBlockDefinitions'
import { useBlockPreviewUrls } from '../../hooks/useBlockPreviewUrls'
import type { BlockType } from '@shared/types/block.types'

type BlockPickerProps = {
  onSelect: (type: BlockType) => void
}

export function BlockPicker({ onSelect }: BlockPickerProps): ReactElement {
  const { data: definitions, error, isLoading } = useBlockDefinitions()
  const previewUrls = useBlockPreviewUrls(
    definitions?.map((definition) => definition.previewKey) ?? [],
  )

  if (isLoading) {
    return <Typography variant="body2">Cargando bloques...</Typography>
  }

  if (error) {
    return (
      <Typography variant="body2" color="error">
        No se pudieron cargar los bloques disponibles.
      </Typography>
    )
  }

  return (
    <Box
      data-onboarding="block-picker"
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
        },
      }}
    >
      {definitions?.map((definition) => (
        <Box key={definition.type}>
          <Card
            onClick={() => onSelect(definition.type)}
            sx={{ cursor: "pointer" }}
          >
            <CardContent>
              <CardMedia
                component="img"
                height="140"
                image={previewUrls[definition.previewKey] ?? ''}
                alt={definition.label}
                sx={{
                  borderRadius: 1,
                  mb: 2,
                  objectFit: "contain",
                  bgcolor: "background.default",
                }}
              />
              <Typography>{definition.previewKey}</Typography>
              <Typography>{definition.label}</Typography>
              <Typography variant="caption">
                {definition.description}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
}
