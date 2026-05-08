export type BlockContentType = "example1" | "example2";

export interface BlockDefinitionDTO {
    type: BlockContentType;
    label: string;
    description: string;
    icon: string;
    defaultContent: string | null;
    mustFill: boolean;
    // metadata de layout para el front
    layout: {
        minCols: number;
        minRows: number;
        resizable: boolean;
    };
}
