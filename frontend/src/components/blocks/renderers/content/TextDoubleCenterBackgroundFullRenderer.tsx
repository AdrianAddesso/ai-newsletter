import { Card, Typography, Box } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import {
  parseContent,
  resolveTypographySx,
} from "../../../../utils/blockContent";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  backgroundImage?: string | null;
  secondaryContent?: string | null;
}

export function TextDoubleCenterBackgroundFullRenderer({
  block,
  backgroundImage = "https://placehold.net/400x400.png",
  secondaryContent = null,
}: Props) {
  const {
    primaryText = "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.",
    secondaryText = secondaryContent ?? "Consequuntur eum voluptas iure repellat voluptate, nisi ipsam explicabo fugit architecto sint adipisci.",
    bgColor,
    fontFamily,
    fontSize,
    typographyStyle,
  } = parseContent(block.content);
  const typographySx = resolveTypographySx(fontSize, typographyStyle, fontFamily);
  const bgSx = backgroundImage
    ? {
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
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
          sx={{ width: "90%", textAlign: "center", ...typographySx }}
        >
          {primaryText}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ width: "90%", textAlign: "center", ...typographySx }}
        >
          {secondaryText}
        </Typography>
      </Box>
    </Card>
  );
}
