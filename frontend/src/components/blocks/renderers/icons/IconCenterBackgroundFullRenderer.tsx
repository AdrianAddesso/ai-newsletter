import { Card, Typography, Box, CardMedia } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import placeholderIconUrl from "../../../../assets/placeholders/PlaceholderIcon.svg";
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
  iconUrl?: string | null;
}

export function IconCenterBackgroundFullRenderer({
  block,
  backgroundImage,
  editMode = false,
  iconUrl = placeholderIconUrl,
}: Props) {
  const values = parseContent(block.content);
  const {
    label = "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.",
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          backgroundColor: bgColor,
          py: 4,
          ...bgSx,
        }}
      >
        {iconUrl && (
          <CardMedia
            component="img"
            image={iconUrl}
            alt="Icon"
            sx={{ width: 48, height: 48, objectFit: "contain" }}
          />
        )}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ width: "90%", textAlign: "center", ...typographySx }}
        >
          {label}
        </Typography>
      </Box>
    </Card>
  );
}
