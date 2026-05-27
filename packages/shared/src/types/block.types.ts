export type BlockContentType = "LAYOUT" | "BASE" | "DIVIDER" | "CONTENT" | "MULTIMEDIA" | "ICONS" | "SPECIAL";

export type BlockType = string;

export type EditFieldType =
  | "text"
  | "textarea"
  | "url"
  | "color"
  | "image-asset"
  | "select"
  | "font-size"
  | "font-style"
  | "font-family";

export type BlockAssetType =
  | "IMAGE"
  | "ICON"
  | "LOGO"
  | "SHAPE"
  | "LOCKUP"
  | "KEYWORD";

export interface BlockEditField {
  key: string;           // key inside the parsed content JSON object
  label: string;         // human-readable label shown in the editor
  type: EditFieldType;
  placeholder?: string;
  options?: { label: string; value: string }[]; // only used when type === 'select'
  assetTypes?: readonly BlockAssetType[]; // only used when type === 'image-asset'
  required?: boolean;
  defaultValue?: string;
}

export interface BlockDefinitionDTO {
  type: BlockType;
  category: BlockContentType;
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
  editFields: BlockEditField[];
}

// Instancia en memoria — aún sin persistir
export interface BlockInstance {
  localId: string;              // crypto.randomUUID() en el cliente
  type: BlockType;
  content: string | null;       // JSON string: { buttonLabel: "Click here", href: "..." }
  mustFill: boolean;
  displayOrder: number;
}
