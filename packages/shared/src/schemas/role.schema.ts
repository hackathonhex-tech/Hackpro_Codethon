import { z } from 'zod';
import { ALL_PERMISSIONS } from '../constants/permissions.js';

export const createRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional().default(''),
  permissions: z.array(z.string()).refine(
    (perms) => perms.every((p) => ALL_PERMISSIONS.includes(p as any)),
    { message: 'Contains invalid permission keys' }
  ),
  isSystem: z.boolean().optional().default(false),
});

export const updateRoleSchema = createRoleSchema.partial();

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
