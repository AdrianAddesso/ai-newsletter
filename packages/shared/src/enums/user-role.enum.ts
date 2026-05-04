export const UserRole = {
    ADMIN: "ADMIN",
    FUNCTIONAL: "FUNCTIONAL",
    USER: "USER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserRoleLabel: Record<UserRole, string> = {
    [UserRole.ADMIN]: "Super Admin",
    [UserRole.FUNCTIONAL]: "Admin Funcional",
    [UserRole.USER]: "Usuario General",
};
