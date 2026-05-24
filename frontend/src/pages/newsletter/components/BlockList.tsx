import { Alert, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { BlockRenderer } from "../../../components/blocks/BlockRenderer";
import type { NewsletterBlock } from "../../../types/newsletter";

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
  const rows = groupBlocksByRow(blocks);

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography variant="h5">Bloques de la plantilla</Typography>
        {readOnly && <Chip label="Solo lectura" />}
      </Stack>
      <Stack spacing={1.5}>
        {rows.map((row) => (
          <Box
            key={row.row}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: `repeat(${row.blocks.length}, minmax(0, 1fr))`,
              },
              gap: 1.5,
              alignItems: "stretch",
            }}
          >
            {row.blocks.map((block) => {
              const isSelected = block.id === selectedBlockId;

              return (
                <Paper
                  key={block.id}
                  component="button"
                  elevation={0}
                  disabled={readOnly}
                  onClick={() => onSelectBlock(block.id)}
                  sx={{
                    width: "100%",
                    textAlign: "left",
                    border: "2px solid",
                    borderColor: isSelected ? "primary.main" : "divider",
                    bgcolor: "background.paper",
                    color: "text.primary",
                    cursor: readOnly ? "default" : "pointer",
                  }}
                >
                  <Box sx={{pointerEvents: "none" }}>
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
                  {block.comment && block.comment.trim().length > 0 && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      {block.comment}
                    </Alert>
                  )}
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
  const rows = new Map<number, NewsletterBlock[]>();

  blocks.forEach((block) => {
    rows.set(block.row, [...(rows.get(block.row) ?? []), block]);
  });

  return Array.from(rows.entries())
    .sort(([leftRow], [rightRow]) => leftRow - rightRow)
    .map(([row, rowBlocks]) => ({
      row,
      blocks: rowBlocks.sort(
        (left, right) => left.gridColumn - right.gridColumn,
      ),
    }));
}

function buildRendererProps(
  block: NewsletterBlock,
): Record<string, string | null | undefined> {
  const textFields = block.fields.filter((field) => field.kind === "text");
  const labelFields = block.fields.filter((field) => field.kind === "label");
  const assetFields = block.fields.filter((field) => field.kind === "asset");
  const firstAssetUrl = assetFields[0]?.assetUrl;
  const secondAssetUrl = assetFields[1]?.assetUrl;

  return {
    secondaryContent: textFields[1]?.value,
    labelContent: labelFields[0]?.value,
    topLabelContent: labelFields[0]?.value,
    bottomLabelContent: labelFields[1]?.value,
    imageUrl: firstAssetUrl,
    backgroundImage: firstAssetUrl,
    leftImageUrl: firstAssetUrl,
    rightImageUrl: secondAssetUrl ?? firstAssetUrl,
  };
}
