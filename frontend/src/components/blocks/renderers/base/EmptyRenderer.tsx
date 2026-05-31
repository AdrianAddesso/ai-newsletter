import { Card } from "@mui/material";
import type { BlockInstance } from "@shared/types/block.types";

interface Props {
    block: BlockInstance;
    editMode?: boolean;
}

export function EmptyRenderer(props: Props) {
    const backgroundColor = "#FF595A";

    return (
        <Card
        sx={{
            width: "100%",
            height: "100%",
            minHeight: 60, // Ensures it doesn't collapse to 0px height without content
            borderRadius: 0,
            backgroundColor: backgroundColor,
        }}
        />
    );
}
