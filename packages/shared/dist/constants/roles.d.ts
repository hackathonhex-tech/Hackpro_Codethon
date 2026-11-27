export declare const SYSTEM_ROLES: {
    readonly SUPER_ADMIN: "super_admin";
    readonly ADMIN: "admin";
    readonly STUDENT: "student";
};
export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
export declare const PREDEFINED_SUB_ROLES: {
    name: string;
    description: string;
    permissions: string[];
}[];
//# sourceMappingURL=roles.d.ts.map