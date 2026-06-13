import { Card, Typography, Box, CardMedia } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import placeholderIconUrl from "../../../../assets/placeholders/PlaceholderIcon.svg";
import {
  buildBackgroundImageSx,
  resolveRenderableBackgroundImage,
} from "../utils/backgroundImage";
import {
  parseContent,
  resolveContentTypographySx,
} from "../../../../utils/blockContent";
import placeholderImageUrl from "../../../../assets/placeholders/PlaceholderImage.svg";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  backgroundImage?: string | null;
  iconUrl?: string | null;
}

export function IconRightBackgroundFullRenderer({
  block,
  backgroundImage = placeholderImageUrl,
  editMode = false,
  iconUrl = placeholderIconUrl,
}: Props) {
  const values = parseContent(block.content);
  const {
    label = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    bgColor,
  } = values;

  const typographySx = resolveContentTypographySx(values, "label");
  const resolvedBackgroundImage = resolveRenderableBackgroundImage(
    backgroundImage,
    editMode,
    placeholderIconUrl,
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
          alignItems: "center",
          backgroundColor: bgColor,
          py: 4,
          ...bgSx,
        }}
      >
        <Box
          sx={{
            width: "90%",
            mx: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "right", ...typographySx }}
          >
            {label}
          </Typography>
          {iconUrl && (
            <CardMedia
              component="img"
              image={iconUrl}
              alt="Icon"
              sx={{
                width: 40,
                height: 40,
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
          )}
        </Box>
      </Box>
    </Card>
  );
}
