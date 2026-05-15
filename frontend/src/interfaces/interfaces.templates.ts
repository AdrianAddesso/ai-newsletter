export type UUID = string;

export interface TemplateState {
    id: UUID;
    title: string;
    layoutMode: "PORTRAIT" | "LANDSCAPE";
    isSkeletonView: boolean;
    rows: RowObject[];
    selectedBlockId: string | null;
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