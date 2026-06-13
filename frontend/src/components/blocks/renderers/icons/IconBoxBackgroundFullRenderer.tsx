import { Card, Typography, Box, CardMedia, Grid } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import placeholderIconUrl from "../../../../assets/placeholders/PlaceholderIcon.svg";
import placeholderImageUrl from "../../../../assets/placeholders/PlaceholderImage.svg";
import {
  parseContent,
  resolveContentTypographySx,
} from "../../../../utils/blockContent";
import {
  buildBackgroundImageSx,
  resolveRenderableBackgroundImage,
} from "../utils/backgroundImage";

interface IconItem {
  iconUrl?: string | null;
  text?: string;
}

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  backgroundImage?: string | null;
  iconUrl?: string | null;
  titleContent?: string | null;
  iconItems?: IconItem[];
}

function isLikelyCopyText(value: string | null | undefined): boolean {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue || trimmedValue === "description") {
    return false;
  }

  return /\s/.test(trimmedValue) || trimmedValue.length > 24;
}

function resolveDisplayLabel(
  label: string | undefined,
  iconName: string | undefined,
  fallbackLabel: string,
): string {
  const trimmedLabel = label?.trim() ?? "";
  const trimmedIconName = iconName?.trim() ?? "";

  if (trimmedLabel && trimmedLabel !== fallbackLabel) {
    return trimmedLabel;
  }

  if (isLikelyCopyText(trimmedIconName)) {
    return trimmedIconName;
  }

  return trimmedLabel || fallbackLabel;
}

export function IconBoxBackgroundFullRenderer({
  block,
  backgroundImage = placeholderImageUrl,
  editMode = false,
  iconUrl = placeholderIconUrl,
  titleContent = null,
  iconItems,
}: Props) {
  const values = parseContent(block.content);
  const fallbackLabel =
    titleContent ?? "Lorem ipsum dolor sit amet consectetur.";
  const {
    label = fallbackLabel,
    bgColor,
    iconName = "description",
    item1Text = "",
    item2Text = "",
    item3Text = "",
    item4Text = "",
  } = values;
  const displayLabel = resolveDisplayLabel(label, iconName, fallbackLabel);
  const blockItemTexts = [item1Text, item2Text, item3Text, item4Text].map(
    (itemText) => itemText?.trim() || displayLabel,
  );
  const resolvedIconItems =
    iconItems && iconItems.length > 0
      ? iconItems
      : blockItemTexts.map((itemText) => ({
          iconUrl,
          text: itemText,
        }));

  const typographySx = resolveContentTypographySx(values, "label");
  const resolvedBackgroundImage = resolveRenderableBackgroundImage(
    backgroundImage,
    editMode,
    placeholderIconUrl,
  );
  const bgSx = buildBackgroundImageSx(resolvedBackgroundImage);
  

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
          sx={{
            width: "90%",
            textAlign: "center",
            fontWeight: 500,
            ...typographySx,
          }}
        >
          {displayLabel}
        </Typography>
        <Grid container sx={{ width: "90%" }}>
          {resolvedIconItems.slice(0, 4).map((item, index) => {
            const currentIconUrl = item.iconUrl ?? iconUrl;

            return (
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
                {currentIconUrl && (
                  <CardMedia
                    component="img"
                    image={currentIconUrl}
                    alt="Icon"
                    sx={{
                      width: 32,
                      height: 32,
                      objectFit: "contain",
                      flexShrink: 0,
                    }}
                  />
                )}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "left", ...typographySx }}
                >
                  {item.text ?? displayLabel}
                </Typography>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Card>
  );
}
