import { Router } from 'express';
import { assignmentsController } from './assignments.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { assignParticipantsSchema, PERMISSIONS } from '@codeathon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logAudit } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/:contestId',
  requirePermission(PERMISSIONS.TEAM_ACCESS_VIEW),
  asyncHandler((req, res) => assignmentsController.getByContest(req, res))
);

router.post(
  '/assign',
  requirePermission(PERMISSIONS.TEAM_ACCESS_ASSIGN),
  validateBody(assignParticipantsSchema),
  logAudit('PARTICIPANTS_ASSIGNED_TO_CONTEST', (req) => ({ contestId: req.body.contestId })),
  asyncHandler((req, res) => assignmentsController.assign(req, res))
);

router.post(
  '/unassign',
  requirePermission(PERMISSIONS.TEAM_ACCESS_UNASSIGN),
  logAudit('PARTICIPANTS_UNASSIGNED_FROM_CONTEST', (req) => ({ contestId: req.body.contestId })),
  asyncHandler((req, res) => assignmentsController.unassign(req, res))
);

export default router;
