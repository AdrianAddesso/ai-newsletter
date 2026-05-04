export const BlockContentType = {
    LAYOUT: "LAYOUT",
    BASE: "BASE",
    DIVIDER: "DIVIDER",
    CONTENT: "CONTENT",
    MULTIMEDIA: "MULTIMEDIA",
    ICONS: "ICONS",
    SPECIAL: "SPECIAL",
} as const;

export type BlockContentType = (typeof BlockContentType)[keyof typeof BlockContentType];

export const BlockContentTypeLabel: Record<BlockContentType, string> = {
    [BlockContentType.LAYOUT]: "Estructural",
    [BlockContentType.BASE]: "Base",
    [BlockContentType.DIVIDER]: "Divisor",
    [BlockContentType.CONTENT]: "Contenido",
    [BlockContentType.MULTIMEDIA]: "Multimedia",
    [BlockContentType.ICONS]: "Íconos",
    [BlockContentType.SPECIAL]: "Bloques Especiales",
};
