import { z } from 'zod';
export const loginSchema = z.object({
    identifier: z.string().min(1, 'Email or Roll Number is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});
export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});
