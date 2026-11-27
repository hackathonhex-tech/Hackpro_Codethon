import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    roleId: z.ZodOptional<z.ZodString>;
    contestScope: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    isActive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    name: string;
    role: string;
    contestScope: string[];
    isActive: boolean;
    roleId?: string | undefined;
}, {
    password: string;
    email: string;
    name: string;
    role?: string | undefined;
    roleId?: string | undefined;
    contestScope?: string[] | undefined;
    isActive?: boolean | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<Omit<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    roleId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    contestScope: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, "email">, "strip", z.ZodTypeAny, {
    password?: string | undefined;
    name?: string | undefined;
    role?: string | undefined;
    roleId?: string | undefined;
    contestScope?: string[] | undefined;
    isActive?: boolean | undefined;
}, {
    password?: string | undefined;
    name?: string | undefined;
    role?: string | undefined;
    roleId?: string | undefined;
    contestScope?: string[] | undefined;
    isActive?: boolean | undefined;
}>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
//# sourceMappingURL=user.schema.d.ts.map