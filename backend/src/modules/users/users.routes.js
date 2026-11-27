import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission, requireSuperAdmin } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createUserSchema, updateUserSchema, PERMISSIONS } from '@codeathon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logAudit } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.USERS_ROLES_VIEW),
  asyncHandler((req, res) => usersController.getAll(req, res))
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.USERS_ROLES_VIEW),
  asyncHandler((req, res) => usersController.getById(req, res))
);

router.post(
  '/',
  requireSuperAdmin(),
  validateBody(createUserSchema),
  logAudit('USER_CREATED', (req) => ({ email: req.body.email, role: req.body.role })),
  asyncHandler((req, res) => usersController.create(req, res))
);

router.patch(
  '/:id',
  requireSuperAdmin(),
  validateBody(updateUserSchema),
  logAudit('USER_UPDATED', (req) => ({ userId: req.params.id })),
  asyncHandler((req, res) => usersController.update(req, res))
);

router.delete(
  '/:id',
  requireSuperAdmin(),
  logAudit('USER_DELETED', (req) => ({ userId: req.params.id })),
  asyncHandler((req, res) => usersController.delete(req, res))
);

export default router;
