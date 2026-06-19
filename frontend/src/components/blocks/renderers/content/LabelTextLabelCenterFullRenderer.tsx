import { Card, Typography, Chip, Box } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import placeholderImageUrl from "../../../../assets/placeholders/PlaceholderImage.svg";
import {
  parseContent,
  resolveContentTypographySx,
} from "../../../../utils/blockContent";
import {
  buildBackgroundImageSx,
  resolveRenderableBackgroundImage,
} from "../utils/backgroundImage";
import { resolveLabelSurfaceSx } from "../utils/labelAppearance";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  backgroundImage?: string | null;
  topLabelContent?: string | null;
  bottomLabelContent?: string | null;
}

export function LabelTextLabelCenterFullRenderer({
  block,
  editMode = false,
  backgroundImage,
  topLabelContent = null,
  bottomLabelContent = null,
}: Props) {
  const values = parseContent(block.content);
  const {
    topLabel = topLabelContent ?? "Lorem ipsum dolor sit amet",
    bodyText = "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.",
    bottomLabel = bottomLabelContent ?? "Consectetur adipiscing elit",
    href = "",
    bgColor,
    backgroundColor,
  } = values;
  const topLabelTypographySx = resolveContentTypographySx(values, "topLabel");
  const bodyTypographySx = resolveContentTypographySx(values, "bodyText");
  const bottomLabelTypographySx = resolveContentTypographySx(values, "bottomLabel");
  const resolvedBackgroundImage = resolveRenderableBackgroundImage(
    backgroundImage,
    editMode,
    placeholderImageUrl,
  );
  const bgSx = buildBackgroundImageSx(resolvedBackgroundImage);
  const labelSurfaceSx = resolveLabelSurfaceSx(bgColor);
  void href;

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
      <Box sx={{ 
        width: "100%", 
        flexGrow: 1, 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        gap: 1.5, 
        py: 2,
        backgroundColor,
        ...bgSx,
        }}>
        <Chip
          label={topLabel}
          sx={{
            maxWidth: "none",
            width: "fit-content",
            height: "auto",
            ...labelSurfaceSx,
            "& .MuiChip-label": {
              whiteSpace: "nowrap",
              overflow: "visible",
              textOverflow: "unset",
              display: "block",
              ...topLabelTypographySx,
            },
          }}
        />
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ width: "90%", textAlign: "center", ...bodyTypographySx }}
          >
          {bodyText}
        </Typography>
        <Chip
          label={bottomLabel}
          sx={{
            maxWidth: "none",
            width: "fit-content",
            height: "auto",
            ...labelSurfaceSx,
            "& .MuiChip-label": {
              whiteSpace: "nowrap",
              overflow: "visible",
              textOverflow: "unset",
              display: "block",
              ...bottomLabelTypographySx,
            },
          }}
        />
      </Box>
    </Card>
  );
}
