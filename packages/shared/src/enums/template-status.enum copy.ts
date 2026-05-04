export const TemplateStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    REMOVED: "REMOVED",
} as const;

export type TemplateStatus =
    (typeof TemplateStatus)[keyof typeof TemplateStatus];

export const TemplateStatusLabel: Record<TemplateStatus, string> = {
    [TemplateStatus.ACTIVE]: "Habilitado",
    [TemplateStatus.INACTIVE]: "Deshabilitado",
    [TemplateStatus.REMOVED]: "Eliminado",
};
