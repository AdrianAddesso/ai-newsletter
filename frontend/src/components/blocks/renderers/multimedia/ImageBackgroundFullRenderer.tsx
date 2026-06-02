import { Card, CardMedia, Box } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import placeholderImageUrl from "../../../../assets/placeholders/PlaceholderImage.svg";
import PlaceholderBackground from "../../../../assets/placeholders/PlaceholderBackground.svg";
import { parseContent } from "../../../../utils/blockContent";
import {
  buildBackgroundImageSx,
  resolveRenderableBackgroundImage,
} from "../utils/backgroundImage";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  backgroundImage?: string | null;
  imageUrl?: string;
}

export function ImageBackgroundFullRenderer({
  block,
  backgroundImage,
  editMode = false,
  imageUrl = placeholderImageUrl,
}: Props) {
  const { altText = "Image", overlayColor } = parseContent(block.content);
  const resolvedBackgroundImage = resolveRenderableBackgroundImage(
    backgroundImage,
    editMode,
    PlaceholderBackground,
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
          justifyContent: "center",
          backgroundColor: overlayColor,
          py: 4,
          ...bgSx,
        }}
      >
        <CardMedia
          component="img"
          image={imageUrl}
          alt={altText}
          sx={{ width: "80%", objectFit: "cover", borderRadius: 1 }}
        />
      </Box>
    </Card>
  );
}
