export const AreaName = {
    COMUNICACION_INTERNA: "COMUNICACION_INTERNA",
    COMUNICACION_CORPORATIVA: "COMUNICACION_CORPORATIVA",
} as const;

export type AreaName = (typeof AreaName)[keyof typeof AreaName];

export const AreaNameLabel: Record<AreaName, string> = {
    [AreaName.COMUNICACION_INTERNA]: "Comunicación Interna",
    [AreaName.COMUNICACION_CORPORATIVA]: "Comunicación Corporativa",
};
