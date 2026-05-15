import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Box,
  Skeleton,
} from "@mui/material";
import type { BlockInstance } from "../../../../../packages/shared/src/types/block.types";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
}

export function Example2Renderer({ block, editMode = false }: Props) {
  return (
    <Card
      sx={{
        width: 300,
        alignSelf: "center",
        borderRadius: 2,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent>
        {block.content ? (
          <Typography variant="body1" color="text.secondary">
            {block.content}
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Skeleton variant="text" width="50%" height={24} />
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="70%" height={24} />
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Button
          variant="contained"
          disableElevation
          sx={{ borderRadius: 1.5, textTransform: "none" }}
        >
          Call to Action
        </Button>
      </CardActions>
    </Card>
  );
}
