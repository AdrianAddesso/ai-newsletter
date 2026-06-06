import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { TemplateCreator } from "./TemplateCreator";
import { mapLayoutItemsToRows } from "../../utils/canvas.utils";
import { CONSTANTS_CANVAS } from "@shared/enums/templates-canvas";
import type { TemplateLayoutItem } from "../../types/newsletter";

export interface PreviewCanvasProps {
  layout: TemplateLayoutItem[];
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ layout }) => {
  const rows = useMemo(() => mapLayoutItemsToRows(layout), [layout]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    setScale(containerWidth / CONSTANTS_CANVAS.BASE_WIDTH);
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box
        sx={{
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          width: CONSTANTS_CANVAS.BASE_WIDTH,
          pointerEvents: "none",
        }}
      >
        <TemplateCreator
          mode="readonly"
          rows={rows}
          isSkeletonView={false}
          selectedBlockId={null}
        />
      </Box>
    </Box>
  );
};
