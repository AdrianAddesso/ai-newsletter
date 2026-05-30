import { Card, CardMedia, Box, Typography } from "@mui/material";
import { useBlockPreviewUrls } from "../../../../hooks/useBlockPreviewUrls";
import type { BlockInstance } from "@shared/types/block.types";
import {
  parseContent,
  resolveContentTypographySx,
} from "../../../../utils/blockContent";

const nestleIsotypeStorageKey = "assets/logos/nestle/nestle_isotype.png";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  imageUrl?: string;
}

export function HeaderLeftRenderer({
  block,
  imageUrl,
}: Props) {
  const values = parseContent(block.content);
  const { title = "", subtitle = "" } = values;
  const titleTypographySx = resolveContentTypographySx(values, "title");
  const subtitleTypographySx = resolveContentTypographySx(values, "subtitle");
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
          justifyContent: "flex-start",
          px: 1.5,
        }}
      >
        <CardMedia
          component="img"
          image={imageUrl || defaultImageUrl}
          alt="Logo"
          sx={{
            height: 60,
            maxHeight: 60,
            width: "auto",
            objectFit: "contain",
          }}
        />
        {(title || subtitle) && (
          <Box sx={{ minWidth: 0, ml: 1.5 }}>
            {title && (
              <Typography
                variant="subtitle2"
                color="common.white"
                noWrap
                sx={{ ...titleTypographySx }}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                variant="caption"
                color="common.white"
                noWrap
                sx={{ ...subtitleTypographySx }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Card>
  );
}
