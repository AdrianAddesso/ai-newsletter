import { Card, Chip, Box } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import {
  parseContent,
  resolveContentTypographySx,
} from "../../../../utils/blockContent";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  backgroundImage?: string | null;
}

export function LabelCenterBackgroundFullRenderer({
  block,
  backgroundImage = "https://placehold.net/400x400.png",
}: Props) {
  const values = parseContent(block.content);
  const { label = "Lorem ipsum dolor sit amet", bgColor } = values;
  const typographySx = resolveContentTypographySx(values, "label");
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
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: bgColor,
          py: 4,
          ...bgSx,
        }}
      >
        <Chip
          label={label}
          sx={{
            maxWidth: "90%",
            "& .MuiChip-label": {
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              ...typographySx,
            },
          }}
        />
      </Box>
    </Card>
  );
}
