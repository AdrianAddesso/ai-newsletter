import { Card, CardActions, Button } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import {
  parseContent,
  resolveTypographySx,
} from "../../../../utils/blockContent";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
}

export function CTAAlternativeRenderer({ block }: Props) {
  const {
    buttonLabel = "Click here",
    href = "",
    fontFamily,
    fontSize,
    typographyStyle,
  } = parseContent(block.content);
  const typographySx = resolveTypographySx(fontSize, typographyStyle, fontFamily);

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
      <CardActions sx={{ flexGrow: 1, p: 1.5 }}>
        <Button variant="outlined" size="small" disableElevation fullWidth href={href || undefined}
          sx={{ borderRadius: 1.5, textTransform: "none", ...typographySx }}>
          {buttonLabel}
        </Button>
      </CardActions>
    </Card>
  );
}
