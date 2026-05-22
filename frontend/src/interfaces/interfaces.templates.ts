export type UUID = string;

export interface TemplateState {
    layoutMode: "PORTRAIT" | "LANDSCAPE";
    isSkeletonView: boolean;
    rows: RowObject[];
    selectedBlockId: string | null;
    name: string;
    description: string;
    promptBase: string;
    area: string;
}

export interface RowObject {
    id: UUID;
    rowIndex: number;
    columns: ColumnObject[];
}

export interface ColumnObject {
    id: UUID; 
    type: string | null; 
    content: string | null;
    mustFill: boolean;
    displayOrder: number;
}