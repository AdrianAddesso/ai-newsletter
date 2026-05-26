import { Card, Typography, Chip, Box } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import {
  parseContent,
  resolveTypographySx,
} from "../../../../utils/blockContent";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  topLabelContent?: string | null;
  bottomLabelContent?: string | null;
}

export function LabelTextLabelCenterFullRenderer({
  block,
  topLabelContent = null,
  bottomLabelContent = null,
}: Props) {
  const {
    topLabel = topLabelContent ?? "Lorem ipsum dolor sit amet",
    bodyText = "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.",
    bottomLabel = bottomLabelContent ?? "Consectetur adipiscing elit",
    fontFamily,
    fontSize,
    typographyStyle,
  } = parseContent(block.content);
  const typographySx = resolveTypographySx(fontSize, typographyStyle, fontFamily);

  return (
    <Card sx={{
  width: "100%",
  alignSelf: "center",
  borderRadius: 0,
  height: "100%",
  display: "flex",
  transition: "all 0.15s ease-in-out",
  "&:hover": {
    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
    transform: "translateY(-1.5px)",
  },
    }}>
      <Box sx={{ width: "100%", flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5, py: 2 }}>
        <Chip
          label={topLabel}
          sx={{
            maxWidth: "90%",
            "& .MuiChip-label": {
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              ...typographySx,
            },
          }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ width: "90%", textAlign: "center", ...typographySx }}>
          {bodyText}
        </Typography>
        <Chip
          label={bottomLabel}
          sx={{
            maxWidth: "90%",
            "& .MuiChip-label": {
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              ...typographySx,
            },
          }}
        />
      </Box>
    </Card>
  );
}
