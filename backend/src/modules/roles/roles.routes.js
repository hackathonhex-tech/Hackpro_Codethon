import { Router } from 'express';
import { rolesController } from './roles.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission, requireSuperAdmin } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createRoleSchema, updateRoleSchema, PERMISSIONS } from '@codeathon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logAudit } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/permissions',
  asyncHandler((req, res) => rolesController.getPermissions(req, res))
);

router.get(
  '/',
  requirePermission(PERMISSIONS.USERS_ROLES_VIEW),
  asyncHandler((req, res) => rolesController.getAll(req, res))
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.USERS_ROLES_VIEW),
  asyncHandler((req, res) => rolesController.getById(req, res))
);

router.post(
  '/',
  requireSuperAdmin(),
  validateBody(createRoleSchema),
  logAudit('ROLE_CREATED', (req) => ({ roleName: req.body.name })),
  asyncHandler((req, res) => rolesController.create(req, res))
);

router.patch(
  '/:id',
  requireSuperAdmin(),
  validateBody(updateRoleSchema),
  logAudit('ROLE_UPDATED', (req) => ({ roleId: req.params.id })),
  asyncHandler((req, res) => rolesController.update(req, res))
);

router.delete(
  '/:id',
  requireSuperAdmin(),
  logAudit('ROLE_DELETED', (req) => ({ roleId: req.params.id })),
  asyncHandler((req, res) => rolesController.delete(req, res))
);

export default router;
