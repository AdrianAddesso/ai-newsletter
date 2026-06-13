import { useState } from "react";
import { Typography, Button, Stack, Box } from "@mui/material";
import { CheckCircleOutlined as UseIcon } from "@mui/icons-material";
import { PreviewCanvas } from "./canvas/PreviewCanvas";
import type { TemplateLayoutItem } from "../types/newsletter";

const AREA_LABELS: Record<string, string> = {
  COMUNICACION_INTERNA: "Comunicación Interna",
  COMUNICACION_CORPORATIVA: "Comunicación Corporativa",
};

interface TemplateCardProps {
  id: string;
  name: string;
  area_id: string;
  state_name: string;
  description: string | null;
  orientation: "Portrait" | "Landscape";
  layout: TemplateLayoutItem[] | null;
  height: number;
  onPreview: (id: string) => void;
  onSelect: (id: string) => void;
}

export function TemplateCard({
  id,
  name,
  area_id,
  state_name,
  description,
  layout,
  onSelect,
  height,
}: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isUsable = state_name === "Activa";
  const layoutExist = layout && layout.length > 0;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height,
        overflow: "hidden",
        bgcolor: "background.paper",
        transition: "box-shadow 0.2s",
        "&:hover": layoutExist ? { boxShadow: 5 } : {},
      }}
      onMouseEnter={() => layoutExist && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview area */}
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        {layoutExist ? (
          <Box sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
            <PreviewCanvas layout={layout} />
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Vista previa no disponible
            </Typography>
          </Box>
        )}
      </Box>

      {/* Hover overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          bgcolor: "rgba(0, 0, 0, 0.88)",
          color: "white",
          zIndex: 2,
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.25s ease-in-out",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: 5,
          textAlign: "center",
        }}
      >
        <Stack spacing={2} sx={{ width: "100%", alignItems: "center" }}>
          <Stack spacing={2} sx={{ alignItems: "center" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              {name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
              Área: {AREA_LABELS[area_id] ?? area_id}
            </Typography>
            {description && (
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {description}
              </Typography>
            )}
          </Stack>
          <Stack spacing={1} sx={{ width: "100%", alignItems: "center" }}>
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<UseIcon />}
              onClick={() => onSelect(id)}
              disabled={!isUsable}
              title={!isUsable ? "Plantilla inactiva o no utilizable" : ""}
              sx={{ width: "50%" }}
            >
              Seleccionar
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
