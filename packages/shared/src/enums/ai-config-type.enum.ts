export const AiConfigType = {
    CREATE: "CREATE",
    REGENERATE: "REGENERATE",
} as const;

export type AiConfigType = (typeof AiConfigType)[keyof typeof AiConfigType];

export const AiConfigTypeLabel: Record<AiConfigType, string> = {
    [AiConfigType.CREATE]: "Generación",
    [AiConfigType.REGENERATE]: "Mejora de texto",
};
