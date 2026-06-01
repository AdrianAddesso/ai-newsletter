import { Alert, Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { BlockRenderer } from '../../../components/blocks/BlockRenderer'
import type {
  NewsletterBlock,
  NewsletterBlockAssetBinding,
} from '../../../types/newsletter'
import { parseContent } from '../../../utils/blockContent'

type Props = {
  blocks: NewsletterBlock[];
  selectedBlockId: string;
  onSelectBlock: (id: string) => void;
  readOnly?: boolean;
};

export function BlockList({
  blocks,
  selectedBlockId,
  onSelectBlock,
  readOnly = false,
}: Props) {
  const rows = groupBlocksByRow(blocks)

  return (
    <Stack
      spacing={2}
      sx={{
        bgcolor: "grey.200", // distinctly grey background
        p: 3, // padding around the whole component
        borderRadius: 2, // slightly rounded outer corners
        height: "100%", // take full height of the container
        maxHeight: "100%",
        overflowY: "auto",
      }}
    >
      <Stack
        direction="row"
        spacing={0}
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h5">Bloques de la plantilla</Typography>
        {readOnly && <Chip label="Solo lectura" />}
      </Stack>
      <Stack spacing={0}>
        {rows.map((row) => (
          <Box
            key={row.row}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: `repeat(${row.blocks.length}, minmax(0, 1fr))`,
              },
              gap: 0,
              alignItems: "stretch",
              backgroundColor: "background.default",
            }}
          >
            {row.blocks.map((block) => {
              const isSelected = block.id === selectedBlockId;

              return (
                <Paper
                  key={block.id}
                  component="button"
                  square
                  elevation={0}
                  disabled={readOnly}
                  onClick={() => onSelectBlock(block.id)}
                  sx={{
                    py: 0,
                    px: 0,
                    width: "100%",
                    minWidth: 0,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    textAlign: "left",
                    p: 0,

                    border: isSelected
                      ? (theme) => `2px solid ${theme.palette.primary.main}`
                      : "0px solid transparent",

                    boxSizing: "border-box",

                    bgcolor: "background.paper",
                    color: "text.primary",
                    cursor: readOnly ? "default" : "pointer",
                    overflow: "hidden",
                    appearance: "none",

                    "&:disabled": {
                      opacity: 1,
                    },
                  }}
                >
                  <Box
                    sx={{
                      pointerEvents: "none",
                      display: "flex",
                      flex: 1,
                      minHeight: 0,
                      "& > *": {
                        width: "100%",
                        height: "100%",
                      },
                    }}
                  >
                    <BlockRenderer
                      block={{
                        id: block.id,
                        type: block.type,
                        content: block.content,
                        mustFill: block.mustFill,
                        displayOrder: block.displayOrder,
                      }}
                      rowIndex={block.row}
                      editMode={!readOnly}
                      rendererProps={buildRendererProps(block)}
                    />
                  </Box>
                  {block.comment && block.comment.trim().length > 0 ? (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      {block.comment}
                    </Alert>
                  ) : null}
                </Paper>
              );
            })}
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

function groupBlocksByRow(
  blocks: NewsletterBlock[],
): Array<{ row: number; blocks: NewsletterBlock[] }> {
  const rows = new Map<number, NewsletterBlock[]>()

  blocks.forEach((block) => {
    rows.set(block.row, [...(rows.get(block.row) ?? []), block])
  })

  return Array.from(rows.entries())
    .sort(([leftRow], [rightRow]) => leftRow - rightRow)
    .map(([row, rowBlocks]) => ({
      row,
      blocks: rowBlocks.sort(
        (left, right) => left.gridColumn - right.gridColumn,
      ),
    }))
}

function buildRendererProps(
  block: NewsletterBlock,
): Record<string, string | null | undefined> {
  const values = parseContent<Record<string, string>>(block.content)
  const assetByFieldKey = new Map<string, NewsletterBlockAssetBinding>(
    block.assetBindings.map((binding) => [binding.fieldKey, binding]),
  )
  const logoAsset = assetByFieldKey.get('logoAsset')?.assetUrl
  const iconAsset = assetByFieldKey.get('iconAsset')?.assetUrl
  const imageAsset = assetByFieldKey.get('imageAsset')?.assetUrl
  const backgroundAsset = assetByFieldKey.get('backgroundAsset')?.assetUrl
  const leftImageAsset =
    assetByFieldKey.get('leftLogoAsset')?.assetUrl ??
    assetByFieldKey.get('leftImageAsset')?.assetUrl
  const rightImageAsset =
    assetByFieldKey.get('rightLogoAsset')?.assetUrl ??
    assetByFieldKey.get('rightImageAsset')?.assetUrl
  const backgroundMode = values.backgroundMode

  return {
    imageUrl: imageAsset ?? logoAsset,
    iconUrl: iconAsset,
    backgroundImage:
      backgroundMode === 'none' || backgroundMode === 'color'
        ? null
        : backgroundMode === 'image'
          ? backgroundAsset ?? undefined
          : backgroundAsset ?? (
              values.bgColor?.trim() || values.overlayColor?.trim()
                ? null
                : undefined
            ),
    leftImageUrl: leftImageAsset,
    rightImageUrl: rightImageAsset,
  }
}
