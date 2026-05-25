import { Card, CardMedia, Box } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import { parseContent } from "../../../../utils/blockContent";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  backgroundImage?: string | null;
  imageUrl?: string;
}

export function ImageBackgroundFullRenderer({
  block,
  backgroundImage = "https://placehold.net/400x400.png",
  imageUrl = "https://placehold.net/4.png",
}: Props) {
  const {
    imageUrl: contentImageUrl = imageUrl,
    altText = "Image",
    overlayColor,
  } = parseContent(block.content);
  const bgSx = backgroundImage
    ? {
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};

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
          image={contentImageUrl}
          alt={altText}
          sx={{ width: "80%", objectFit: "cover", borderRadius: 1 }}
        />
      </Box>
    </Card>
  );
}
