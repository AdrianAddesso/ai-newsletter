import { Card, CardActions, Button } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";
import {
  parseContent,
  resolveContentTypographySx,
} from "../../../../utils/blockContent";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
}

export function CTAFullRenderer({ block }: Props) {
  const values = parseContent(block.content);
  const {
    buttonLabel = "Click here",
    href = "",
    bgColor,
  } = values;
  const typographySx = resolveContentTypographySx(values, "buttonLabel");

  return (
    <Card sx={{
  width: "100%",
  alignSelf: "center",
  borderRadius: 0,
  height: "100%",
  display: "flex",
  backgroundColor: bgColor,
  transition: "all 0.15s ease-in-out",
  "&:hover": {
    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
    transform: "translateY(-1.5px)",
  },
    }}>
      <CardActions sx={{ flexGrow: 1, p: 1.5 }}>
        <Button variant="contained" size="small" disableElevation fullWidth href={href || undefined}
          sx={{ borderRadius: 1.5, textTransform: "none", ...typographySx }}>
          {buttonLabel}
        </Button>
      </CardActions>
    </Card>
  );
}
