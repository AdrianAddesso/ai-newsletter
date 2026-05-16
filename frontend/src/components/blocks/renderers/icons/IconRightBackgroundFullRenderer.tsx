import { Card, Typography, Box, CardMedia } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import type { BlockInstance } from "../../../../../../packages/shared/src/types/block.types";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  backgroundImage?: string | null;
  iconUrl?: string | null;
}

export function IconRightBackgroundFullRenderer({
  block,
  editMode = false,
  backgroundImage = "https://placehold.net/400x400.png",
  iconUrl = null,
}: Props) {
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
          alignItems: "center",
          py: 4,
          ...bgSx,
        }}
      >
        <Box
          sx={{
            width: "90%",
            mx: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "right" }}
          >
            {block.content ??
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}
          </Typography>
          {iconUrl ? (
            <CardMedia
              component="img"
              image={iconUrl}
              alt="Icon"
              sx={{
                width: 40,
                height: 40,
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
          ) : (
            <DescriptionIcon
              fontSize="large"
              color="action"
              sx={{ flexShrink: 0 }}
            />
          )}
        </Box>
      </Box>
    </Card>
  );
}
