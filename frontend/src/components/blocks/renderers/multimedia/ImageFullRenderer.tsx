import { Card, CardMedia } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import { parseContent } from "../../../../utils/blockContent";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  imageUrl?: string;
}

export function ImageFullRenderer({
  block,
  imageUrl = "https://placehold.net/400x400.png",
}: Props) {
  const { imageUrl: contentImageUrl = imageUrl, altText = "Full image" } =
    parseContent(block.content);

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
      <CardMedia
        component="img"
        image={contentImageUrl}
        alt={altText}
        sx={{ width: "100%", flexGrow: 1, objectFit: "cover" }}
      />
    </Card>
  );
}
