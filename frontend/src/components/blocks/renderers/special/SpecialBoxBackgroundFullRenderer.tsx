import { Card, Typography, Chip, CardMedia, Box, Grid } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import {
  parseContent,
  resolveTypographySx,
} from "../../../../utils/blockContent";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  backgroundImage?: string | null;
  imageUrl?: string;
  labelContent?: string | null;
  text1Content?: string | null;
  text2Content?: string | null;
  text3Content?: string | null;
}

export function SpecialBoxBackgroundFullRenderer({
  block,
  backgroundImage = null,
  imageUrl = "https://placehold.co/120x160/e0e0e0/9e9e9e?text=Image",
  labelContent = null,
  text1Content = null,
  text2Content = null,
  text3Content = null,
}: Props) {
  const {
    title = labelContent ?? "Lorem ipsum sit",
    text = text2Content ?? "Provident blanditiis omnis natus ratione necessitatibus.",
    bgColor,
    fontSize,
    typographyStyle,
  } = parseContent(block.content);
  const typographySx = resolveTypographySx(fontSize, typographyStyle);
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
          alignItems: "stretch",
          backgroundColor: bgColor,
          py: 4,
          ...bgSx,
        }}
      >
        <Grid container sx={{ width: "100%" }}>
          <Grid
            size={{ xs: 8 }}
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 1.5,
              pl: 2,
              pr: 1,
            }}
          >
            <Chip
              label={title}
              sx={{
                alignSelf: "flex-start",
                maxWidth: "100%",
                "& .MuiChip-label": {
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", ...typographySx }}
            >
              {text1Content ??
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", ...typographySx }}
            >
              {text}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", ...typographySx }}
            >
              {text3Content ??
                "Consequuntur eum voluptas iure repellat voluptate nisi."}
            </Typography>
          </Grid>
          <Grid
            size={{ xs: 4 }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pr: 1,
            }}
          >
            <CardMedia
              component="img"
              image={imageUrl}
              alt="Image"
              sx={{ width: "80%", borderRadius: 1, objectFit: "contain" }}
            />
          </Grid>
        </Grid>
      </Box>
    </Card>
  );
}
