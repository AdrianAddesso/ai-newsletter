export const UserStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    REMOVED: "REMOVED",
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const UserStatusLabel: Record<UserStatus, string> = {
    [UserStatus.ACTIVE]: "Habilitado",
    [UserStatus.INACTIVE]: "Deshabilitado",
    [UserStatus.REMOVED]: "Eliminado",
};
