import { Router } from 'express';
import { teamsController } from './teams.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createTeamSchema, PERMISSIONS } from '@codeathon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logAudit } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.PARTICIPANTS_VIEW),
  asyncHandler((req, res) => teamsController.getAll(req, res))
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.PARTICIPANTS_VIEW),
  asyncHandler((req, res) => teamsController.getById(req, res))
);

router.post(
  '/',
  requirePermission(PERMISSIONS.PARTICIPANTS_CREATE),
  validateBody(createTeamSchema),
  logAudit('TEAM_CREATED', (req) => ({ teamName: req.body.name })),
  asyncHandler((req, res) => teamsController.create(req, res))
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.PARTICIPANTS_UPDATE),
  asyncHandler((req, res) => teamsController.update(req, res))
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.PARTICIPANTS_DELETE),
  logAudit('TEAM_DELETED', (req) => ({ teamId: req.params.id })),
  asyncHandler((req, res) => teamsController.delete(req, res))
);

export default router;
