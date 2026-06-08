import { Card, Typography, Chip, CardMedia, Box, Grid } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import placeholderImageUrl from "../../../../assets/placeholders/PlaceholderImage.svg";
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
  imageUrl?: string;
  labelContent?: string | null;
  text1Content?: string | null;
  text2Content?: string | null;
  text3Content?: string | null;
}

export function SpecialBoxBackgroundFullRenderer({
  block,
  backgroundImage,
  editMode = false,
  imageUrl = placeholderImageUrl,
}: Props) {
  const values = parseContent(block.content);
  const {
    title = "Lorem ipsum sit",
    introText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    bodyText = "Provident blanditiis omnis natus ratione necessitatibus.",
    closingText = "Consequuntur eum voluptas iure repellat voluptate nisi.",
    bgColor,
  } = values;
  const titleTypographySx = resolveContentTypographySx(values, "title");
  const introTypographySx = resolveContentTypographySx(values, "introText");
  const bodyTypographySx = resolveContentTypographySx(values, "bodyText");
  const closingTypographySx = resolveContentTypographySx(values, "closingText");
  const resolvedBackgroundImage = resolveRenderableBackgroundImage(
    backgroundImage,
    editMode,
    placeholderImageUrl,
  );
  const bgSx = buildBackgroundImageSx(resolvedBackgroundImage);
  const { href = "" } = values;

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
                  ...titleTypographySx,
                },
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", ...introTypographySx }}
            >
              {introText}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", ...bodyTypographySx }}
            >
              {bodyText}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", ...closingTypographySx }}
            >
              {closingText}
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
