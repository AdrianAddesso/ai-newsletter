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
  | "font-family"
  | "font-color";

export type BlockAssetType =
  | "IMAGE"
  | "ICON"
  | "LOGO"
  | "SHAPE"
  | "LOCKUP"
  | "KEYWORD";

export interface BlockEditField {
  key: string; 
  label: string;
  type: EditFieldType;
  placeholder?: string;
  options?: { label: string; value: string }[];
  assetTypes?: readonly BlockAssetType[]; 
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
  layout: {
    minCols: number;
    minRows: number;
    resizable: boolean;
  };
  editFields: BlockEditField[];
}

export interface BlockInstance {
  localId: string;
  type: BlockType;
  content: string | null;
  mustFill: boolean;
  displayOrder: number;
}
