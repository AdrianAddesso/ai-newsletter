import { Card, Typography, Box, CardMedia, Icon } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import placeholderIconUrl from "../../../../assets/placeholders/PlaceholderIcon.svg";
import {
  parseContent,
  resolveContentTypographySx,
} from "../../../../utils/blockContent";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  backgroundImage?: string | null;
  iconUrl?: string | null;
}

export function IconCenterBackgroundFullRenderer({
  block,
  backgroundImage = null,
  iconUrl = placeholderIconUrl,
}: Props) {
  const values = parseContent(block.content);
  const {
    iconName = "description",
    label = "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.",
  } = values;
  const typographySx = resolveContentTypographySx(values, "label");
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
          py: 4,
          ...bgSx,
        }}
      >
        {iconUrl ? (
          <CardMedia
            component="img"
            image={iconUrl}
            alt="Icon"
            sx={{ width: 48, height: 48, objectFit: "contain" }}
          />
        ) : (
          <Icon sx={{ fontSize: 48 }} color="action">
            {iconName}
          </Icon>
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
