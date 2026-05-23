import { Card, CardMedia } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  imageUrl?: string;
}

export function ImageFullRenderer({
  block,
  editMode = false,
  imageUrl = "https://placehold.net/4.png",
}: Props) {
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
        image={imageUrl}
        alt="Full image"
        sx={{ width: "100%", flexGrow: 1, objectFit: "cover" }}
      />
    </Card>
  );
}
