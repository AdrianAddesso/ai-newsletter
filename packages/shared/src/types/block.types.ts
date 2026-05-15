export type BlockContentType = "LAYOUT" | "BASE" | "DIVIDER" | "CONTENT" | "MULTIMEDIA" | "ICONS" | "SPECIAL";


export interface BlockDefinitionDTO {
  type: BlockContentType;
  label: string;
  description: string;
  icon: string;
  previewKey: string;
  defaultContent: string | null;
  mustFill: boolean;
  // metadata de layout para el front
  layout: {
    minCols: number;
    minRows: number;
    resizable: boolean;
  };
}

// Instancia en memoria — aún sin persistir
export interface BlockInstance {
  localId: string; // crypto.randomUUID() en el cliente
  type: BlockContentType;
  content: string | null;
  mustFill: boolean;
  displayOrder: number;
}
