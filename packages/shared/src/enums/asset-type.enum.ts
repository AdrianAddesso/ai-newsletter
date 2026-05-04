export const AssetType = {
    IMAGE: "IMAGE",
    ICON: "ICON",
    LOGO: "LOGO",
    SHAPE: "SHAPE",
    LOCKUP: "LOCKUP",
    KEYWORD: "KEYWORD",
} as const;

export type AssetType = (typeof AssetType)[keyof typeof AssetType];

export const AssetTypeLabel: Record<AssetType, string> = {
    [AssetType.IMAGE]: "Imagen",
    [AssetType.ICON]: "Ícono",
    [AssetType.LOGO]: "Logo",
    [AssetType.SHAPE]: "Formas",
    [AssetType.LOCKUP]: "Lockup",
    [AssetType.KEYWORD]: "Keywords",
};
