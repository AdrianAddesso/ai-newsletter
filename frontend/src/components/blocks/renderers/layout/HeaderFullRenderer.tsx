import { Card, CardMedia, Box, Typography } from "@mui/material";
import placeholderLogo from "../../../../assets/placeholders/PlaceholderIcon.svg";
import type { BlockInstance } from "@shared/types/block.types";
import {
  parseContent,
  resolveContentTypographySx,
} from "../../../../utils/blockContent";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  leftImageUrl?: string;
  rightImageUrl?: string;
}

export function HeaderFullRenderer({
  block,
  leftImageUrl,
  rightImageUrl,
}: Props) {
  const values = parseContent(block.content);
  const { title = "", subtitle = "" } = values;
  const titleTypographySx = resolveContentTypographySx(values, "title");
  const subtitleTypographySx = resolveContentTypographySx(values, "subtitle");
  const defaultImageUrl = placeholderLogo;
  const backgroundColor = values.bgColor || "#FF595A";

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
          image={leftImageUrl || defaultImageUrl}
          alt="Left logo"
          sx={{
            height: 60,
            maxHeight: 60,
            width: "auto",
            objectFit: "contain",
          }}
        />
        {(title || subtitle) && (
          <Box sx={{ flex: 1, minWidth: 0, px: 1, textAlign: "center" }}>
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
        <CardMedia
          component="img"
          image={rightImageUrl || defaultImageUrl}
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
