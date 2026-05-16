import { Card, CardActions, Button } from "@mui/material";
import type { BlockInstance } from "../../../../../../packages/shared/src/types/block.types";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
}

export function CTAAlternativeRenderer({ block, editMode = false }: Props) {
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
        <Button variant="outlined" size="small" disableElevation fullWidth
          sx={{ borderRadius: 1.5, textTransform: "none" }}>
          {block.content ?? "Click here"}
        </Button>
      </CardActions>
    </Card>
  );
}
