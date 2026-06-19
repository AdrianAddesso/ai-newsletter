import { Card, Typography, Chip, CardMedia, Box, Grid } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import placeholderImageUrl from "../../../../assets/placeholders/PlaceholderImage.svg";
import PlaceholderBackground from "../../../../assets/placeholders/PlaceholderBackground.svg";
import {
  parseContent,
  resolveContentTypographySx,
} from "../../../../utils/blockContent";
import {
  buildBackgroundImageSx,
  resolveRenderableBackgroundImage,
} from "../utils/backgroundImage";
import { resolveLabelSurfaceSx } from "../utils/labelAppearance";


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
  backgroundImage = PlaceholderBackground,
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
  const labelSurfaceSx = resolveLabelSurfaceSx(bgColor);
  const resolvedImageUrl = imageUrl || placeholderImageUrl;

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
                maxWidth: "none",
                width: "fit-content",
                height: "auto",
                ...labelSurfaceSx,
                "& .MuiChip-label": {
                  whiteSpace: "nowrap",
                  overflow: "visible",
                  textOverflow: "unset",
                  display: "block",
                  ...titleTypographySx,
                },
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ width: "100%", textAlign: "left", ...introTypographySx }}
            >
              {introText}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ width: "100%", textAlign: "left", ...bodyTypographySx }}
            >
              {bodyText}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ width: "100%", textAlign: "left", ...closingTypographySx }}
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
              image={resolvedImageUrl}
              alt="Image"
              sx={{ width: "100%", height: "100%", borderRadius: 1, objectFit: "cover" }}
            />
          </Grid>
        </Grid>
      </Box>
    </Card>
  );
}
