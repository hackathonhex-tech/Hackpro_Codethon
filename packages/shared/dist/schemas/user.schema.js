import { z } from 'zod';
export const createUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.string().optional().default('admin'),
    roleId: z.string().optional(),
    contestScope: z.array(z.string()).optional().default([]), // specific contests or empty for global
    isActive: z.boolean().optional().default(true),
});
export const updateUserSchema = createUserSchema.partial().omit({ email: true });
