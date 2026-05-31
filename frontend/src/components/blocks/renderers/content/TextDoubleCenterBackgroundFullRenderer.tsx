import { Card, Typography, Box } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import placeholderImageUrl from "../../../../assets/placeholders/PlaceholderImage.svg";
import {
  parseContent,
  resolveContentTypographySx,
} from "../../../../utils/blockContent";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  backgroundImage?: string | null;
  secondaryContent?: string | null;
}

export function TextDoubleCenterBackgroundFullRenderer({
  block,
  backgroundImage = placeholderImageUrl,
  secondaryContent = null,
}: Props) {
  const values = parseContent(block.content);
  const {
    primaryText = "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.",
    secondaryText = secondaryContent ?? "Consequuntur eum voluptas iure repellat voluptate, nisi ipsam explicabo fugit architecto sint adipisci.",
    bgColor,
  } = values;
  const primaryTypographySx = resolveContentTypographySx(values, "primaryText");
  const secondaryTypographySx = resolveContentTypographySx(values, "secondaryText");
  const bgSx = backgroundImage
    ? {
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: "cover",
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
          sx={{ width: "90%", textAlign: "center", ...primaryTypographySx }}
        >
          {primaryText}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ width: "90%", textAlign: "center", ...secondaryTypographySx }}
        >
          {secondaryText}
        </Typography>
      </Box>
    </Card>
  );
}
