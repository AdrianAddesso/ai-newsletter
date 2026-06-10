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

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  backgroundImage?: string | null;
  labelContent?: string | null;
}

export function TextLabelCenterBackgroundFullRenderer({
  block,
  backgroundImage,
  editMode = false,
  labelContent = null,
}: Props) {
  const values = parseContent(block.content);
  const {
    label = labelContent ?? "Lorem ipsum dolor sit amet",
    text = "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.",
    bgColor,
    href = "",
  } = values;
  const textTypographySx = resolveContentTypographySx(values, "text");
  const labelTypographySx = resolveContentTypographySx(values, "label");
  const resolvedBackgroundImage = resolveRenderableBackgroundImage(
    backgroundImage,
    editMode,
    placeholderImageUrl,
  );
  const bgSx = buildBackgroundImageSx(resolvedBackgroundImage);

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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          backgroundColor: bgColor,
          py: 4,
          ...bgSx,
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ width: "90%", textAlign: "center", ...textTypographySx }}
        >
          {text}
        </Typography>
        <Chip
          label={label}
          sx={{
            maxWidth: "none",
            width: "fit-content",
            height: 'auto',
            "& .MuiChip-label": {
              whiteSpace: "nowrap",
              overflow: "visible",
              textOverflow: "unset",
              display: 'block',
              ...labelTypographySx,
            },
          }}
        />
      </Box>
    </Card>
  );
}
