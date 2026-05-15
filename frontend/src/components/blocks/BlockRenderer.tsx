import type { ColumnObject } from "../../interfaces/interfaces.templates";
import { Example1Renderer } from "./renderers/Example1Renderer";
import { Example2Renderer } from "./renderers/Example2Renderer";
import { Box, Typography } from "@mui/material";

interface Props {
  block: ColumnObject;
  editMode?: boolean;
  rowIndex: number;
}

export function BlockRenderer({ block, rowIndex, editMode = false }: Props) {
  const blockInstance = {
    localId: block.id,
    type: block.type as any,
    content: block.content,
    mustFill: block.mustFill,
    displayOrder: block.displayOrder
  };

  switch (block.type) {
    case "LAYOUT":
      return <Example1Renderer block={blockInstance} editMode={editMode} />;
    case "BASE":
      return <Example2Renderer block={blockInstance} editMode={editMode} />;
    default:
      return (
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100px',
          border: '1px dashed #ccc',
          p: 2,
          gap: 0.5,
          opacity: 0.5,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: 'rgba(0,0,0,0.05)',
            borderColor: '#bbb'
          }
        }}>
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
            FILA {rowIndex + 1} | COLUMNA {block.displayOrder + 1}
          </Typography>
        </Box>
      );
  }
}
