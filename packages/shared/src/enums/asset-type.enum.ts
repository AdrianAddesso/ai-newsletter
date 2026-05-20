export const AssetType = {
  IMAGE: "IMAGE",
  ICON: "ICON",
  LOGO: "LOGO",
  SHAPE: "SHAPE",
  LOCKUP: "LOCKUP",
  KEYWORD: "KEYWORD",
  BLOCK: "BLOCK",
} as const;

export type AssetType = (typeof AssetType)[keyof typeof AssetType];

export const AssetTypeLabel: Record<AssetType, string> = {
    [AssetType.IMAGE]: "Imagen",
    [AssetType.ICON]: "Ícono",
    [AssetType.LOGO]: "Logo",
    [AssetType.SHAPE]: "Formas",
    [AssetType.LOCKUP]: "Lockup",
    [AssetType.KEYWORD]: "Keywords",
    [AssetType.BLOCK]: "Blocks",
};
