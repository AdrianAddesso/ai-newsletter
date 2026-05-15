import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Typography,
  Box,
  Skeleton,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import type { BlockInstance } from "../../../../../packages/shared/src/types/block.types";

interface Props {
  block: BlockInstance;
  editMode?: boolean;
}

export function Example1Renderer({ block, editMode = false }: Props) {
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
      {/* Placeholder Image */}
      <CardMedia
        component="img"
        height="80"
        image="https://placehold.co/150x80/e0e0e0/9e9e9e?text=Image"
        alt="Placeholder"
      />

      <CardContent sx={{ p: 1.5, pb: 0 }}>
        {block.content ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <DescriptionIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" noWrap>
              {block.content}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="80%" height={20} />
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ p: 1.5 }}>
        <Button
          variant="contained"
          size="small"
          disableElevation
          fullWidth
          sx={{ borderRadius: 1.5, textTransform: "none" }}
        >
          Action
        </Button>
      </CardActions>
    </Card>
  );
}
