import { Card, CardMedia, Box } from "@mui/material";
import { useBlockPreviewUrls } from "../../../../hooks/useBlockPreviewUrls";
import type { BlockInstance } from "../../../../../../packages/shared/src/types/block.types";

const nestleIsotypeStorageKey = "assets/logos/nestle/nestle_isotype.png";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  leftImageUrl?: string;
  rightImageUrl?: string;
}

export function HeaderFullRenderer({
  leftImageUrl,
  rightImageUrl,
}: Props) {
  const previewUrls = useBlockPreviewUrls([nestleIsotypeStorageKey], "LOGO");
  const defaultImageUrl = previewUrls[nestleIsotypeStorageKey] ?? "";
  const backgroundColor = "#FF595A";

  return (
    <Card
      sx={{
        width: "100%",
        alignSelf: "center",
        borderRadius: 0,
        height: "100%",
        display: "flex",
        backgroundColor: backgroundColor,
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
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
        }}
      >
        <CardMedia
          component="img"
          image={leftImageUrl ?? defaultImageUrl}
          alt="Left logo"
          sx={{
            height: 60,
            maxHeight: 60,
            width: "auto",
            objectFit: "contain",
          }}
        />
        <CardMedia
          component="img"
          image={rightImageUrl ?? defaultImageUrl}
          alt="Right logo"
          sx={{
            height: 60,
            maxHeight: 60,
            width: "auto",
            objectFit: "contain",
          }}
        />
      </Box>
    </Card>
  );
}
