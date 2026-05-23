import { Card, Chip, Box } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
  backgroundImage?: string | null;
}

export function LabelLeftBackgroundFullRenderer({
  block,
  editMode = false,
  backgroundImage = "https://placehold.net/400x400.png",
}: Props) {
  const bgSx = backgroundImage
    ? {
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};

  return (
    <Card sx={{
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
    }}>
      <Box sx={{ width: "100%", flexGrow: 1, display: "flex", alignItems: "center", py: 4, ...bgSx }}>
        <Box sx={{ width: "90%", mx: "auto" }}>
          <Chip
            label={block.content ?? "Lorem ipsum dolor sit amet"}
            sx={{ maxWidth: "100%", "& .MuiChip-label": { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }}
          />
        </Box>
      </Box>
    </Card>
  );
}
