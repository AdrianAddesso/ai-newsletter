import { Card, Chip, Box } from "@mui/material";
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
}

export function LabelLeftBackgroundSmallRenderer({
  block,
  backgroundImage,
  editMode = false,
}: Props) {
  const values = parseContent(block.content);
  const {
    label = "Lorem ipsum dolor sit amet",
    bgColor,
    backgroundColor,
    href = "",
  } = values;
  const typographySx = resolveContentTypographySx(values, "label");
  const resolvedBackgroundImage = resolveRenderableBackgroundImage(
    backgroundImage,
    editMode,
    placeholderImageUrl,
  );
  const bgSx = buildBackgroundImageSx(resolvedBackgroundImage);
  const labelSurfaceSx = resolveLabelSurfaceSx(bgColor);

  return (
    <Card
      sx={{
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
      }}
    >
      <Box
        sx={{
          width: "100%",
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          backgroundColor,
          py: 1.5,
          ...bgSx,
        }}
      >
        <Box sx={{ width: "90%", mx: "auto" }}>
          <Chip
            label={label}
            size="small"
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
                ...typographySx,
              },
            }}
          />
        </Box>
      </Box>
    </Card>
  );
}
