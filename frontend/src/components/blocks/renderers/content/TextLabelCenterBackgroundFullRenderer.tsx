import { Card, Typography, Chip, Box } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import {
  parseContent,
  resolveContentTypographySx,
} from "../../../../utils/blockContent";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  backgroundImage?: string | null;
  labelContent?: string | null;
}

export function TextLabelCenterBackgroundFullRenderer({
  block,
  backgroundImage = "https://placehold.net/400x400.png",
  labelContent = null,
}: Props) {
  const values = parseContent(block.content);
  const {
    label = labelContent ?? "Lorem ipsum dolor sit amet",
    text = "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Provident blanditiis omnis natus ratione necessitatibus consequuntur eum voluptas iure repellat.",
    bgColor,
  } = values;
  const textTypographySx = resolveContentTypographySx(values, "text");
  const labelTypographySx = resolveContentTypographySx(values, "label");
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
          sx={{ width: "90%", textAlign: "left", ...textTypographySx }}
        >
          {text}
        </Typography>
        <Chip
          label={label}
          sx={{
            maxWidth: "90%",
            "& .MuiChip-label": {
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              ...labelTypographySx,
            },
          }}
        />
      </Box>
    </Card>
  );
}
