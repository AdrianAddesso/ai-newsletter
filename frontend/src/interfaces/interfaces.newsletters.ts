export type UUID = string;

export interface NewsletterState {
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
    type: string | null; //This will store the block_content_id (UUID)
    displayOrder: number;
}