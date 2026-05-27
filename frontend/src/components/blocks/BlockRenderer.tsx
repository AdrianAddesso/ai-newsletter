import { Box, Typography } from "@mui/material";
import type { ElementType } from "react";
import type { ColumnObject } from "../../interfaces/interfaces.templates";
import * as AllRenderers from "./renderers";

// Map your exact block types to their specific renderer components
    const RendererMap: Record<string, ElementType> = {
      // BASE
        ctaAlternative: AllRenderers.CTAAlternativeRenderer,
        ctaFull: AllRenderers.CTAFullRenderer,

        // CONTENT
        labelCenterBackgroundFull: AllRenderers.LabelCenterBackgroundFullRenderer,
        labelLeftBackgroundFull: AllRenderers.LabelLeftBackgroundFullRenderer,
        labelLeftBackgroundSmall: AllRenderers.LabelLeftBackgroundSmallRenderer,
        labelTextLabelCenterFull: AllRenderers.LabelTextLabelCenterFullRenderer,
        textCenterBackgroundFull: AllRenderers.TextCenterBackgroundFullRenderer,
        textDoubleCenterBackgroundFull: AllRenderers.TextDoubleCenterBackgroundFullRenderer,
        textLabelCenterBackgroundFull: AllRenderers.TextLabelCenterBackgroundFullRenderer,
        textLeftBackgroundFull: AllRenderers.TextLeftBackgroundFullRenderer,

        // ICONS
        iconBoxBackgroundFull: AllRenderers.IconBoxBackgroundFullRenderer,
        iconCenterBackgroundFull: AllRenderers.IconCenterBackgroundFullRenderer,
        iconLeftBackgroundFull: AllRenderers.IconLeftBackgroundFullRenderer,
        iconRightBackgroundFull: AllRenderers.IconRightBackgroundFullRenderer,

        // LAYOUT
        headerFull: AllRenderers.HeaderFullRenderer,
        headerLeft: AllRenderers.HeaderLeftRenderer,
        headerRight: AllRenderers.HeaderRightRenderer,

        // MULTIMEDIA
        imageBackgroundFull: AllRenderers.ImageBackgroundFullRenderer,
        imageFull: AllRenderers.ImageFullRenderer,

        // SPECIAL
        specialBoxBackgroundFull: AllRenderers.SpecialBoxBackgroundFullRenderer,
    };

    interface Props {
    block: ColumnObject;
    editMode?: boolean;
    rowIndex: number;
    rendererProps?: Record<string, string | null | undefined>;
    }

    export function BlockRenderer({ block, rowIndex, editMode = false, rendererProps = {} }: Props) {
    const blockInstance = {
        localId: block.id,
        type: block.type ?? "",
        content: block.content,
        mustFill: block.mustFill,
        displayOrder: block.displayOrder,
    };

    const SelectedRenderer = RendererMap[block.type ?? ""];

    // If a matching renderer is found, render it
    if (SelectedRenderer) {
        return <SelectedRenderer block={blockInstance} editMode={editMode} {...rendererProps} />;
    }

  // Default fallback for unknown or unmapped types
    return (
        <Box
        sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100px",
            border: "1px dashed #ccc",
            p: 2,
            gap: 0.5,
            opacity: 0.5,
            transition: "all 0.2s ease",
            "&:hover": {
            bgcolor: "rgba(0,0,0,0.05)",
            borderColor: "#bbb",
            },
        }}
        >
        <Typography
            variant="caption"
            sx={{ fontWeight: 700, fontSize: "0.7rem" }}
        >
            FILA {rowIndex + 1} | COLUMNA {block.displayOrder + 1}
        </Typography>
        </Box>
    );
}
