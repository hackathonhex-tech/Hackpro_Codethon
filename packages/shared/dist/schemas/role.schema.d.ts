import { z } from 'zod';
export declare const createRoleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    permissions: z.ZodEffects<z.ZodArray<z.ZodString, "many">, string[], string[]>;
    isSystem: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    permissions: string[];
    isSystem: boolean;
}, {
    name: string;
    permissions: string[];
    description?: string | undefined;
    isSystem?: boolean | undefined;
}>;
export declare const updateRoleSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    permissions: z.ZodOptional<z.ZodEffects<z.ZodArray<z.ZodString, "many">, string[], string[]>>;
    isSystem: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    permissions?: string[] | undefined;
    isSystem?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    permissions?: string[] | undefined;
    isSystem?: boolean | undefined;
}>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
//# sourceMappingURL=role.schema.d.ts.map