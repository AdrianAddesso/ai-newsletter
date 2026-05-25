import { Card, Typography, Box, CardMedia, Grid, Icon } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import {
  parseContent,
  resolveTypographySx,
} from "../../../../utils/blockContent";

interface IconItem {
    iconUrl?: string | null;
    iconName?: string;
    text?: string;
}

interface Props {
    block: BlockInstance;
    editMode?: boolean;
    backgroundImage?: string | null;
    titleContent?: string | null;
    iconItems?: IconItem[];
}

const DEFAULT_ICON_ITEMS: IconItem[] = [
    { text: "Lorem ipsum dolor sit amet consectetur." },
    { text: "Adipiscing elit provident blanditiis." },
    { text: "Natus ratione necessitatibus consequuntur." },
    { text: "Eum voluptas iure repellat voluptate." },
];

export function IconBoxBackgroundFullRenderer({
  block,
  backgroundImage = "https://placehold.net/400x400.png",
  titleContent = null,
  iconItems = DEFAULT_ICON_ITEMS,
}: Props) {
  const {
    iconName = "description",
    label = titleContent ?? "Lorem ipsum dolor sit amet consectetur.",
    bgColor,
    fontSize,
    typographyStyle,
  } = parseContent(block.content);
  const typographySx = resolveTypographySx(fontSize, typographyStyle);
  const bgSx = backgroundImage
    ? {
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
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
          gap: 2,
          backgroundColor: bgColor,
          py: 4,
          ...bgSx,
        }}
      >
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ width: "90%", textAlign: "center", fontWeight: 500, ...typographySx }}
        >
          {label}
        </Typography>
        <Grid container sx={{ width: "90%" }}>
          {iconItems.slice(0, 4).map((item, index) => (
            <Grid
              key={index}
              size={{ xs: 6 }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                py: 1,
                px: 0.5,
              }}
            >
              {item.iconUrl ? (
                <CardMedia
                  component="img"
                  image={item.iconUrl}
                  alt="Icon"
                  sx={{
                    width: 32,
                    height: 32,
                    objectFit: "contain",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <Icon
                  fontSize="medium"
                  color="action"
                  sx={{ flexShrink: 0 }}
                >
                  {item.iconName ?? iconName}
                </Icon>
              )}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "left", ...typographySx }}
              >
                {item.text ?? label}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Card>
  );
}
