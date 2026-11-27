import { Router } from 'express';
import { contestsController } from './contests.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { checkContestScope } from '../../middleware/contestScope.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createContestSchema, updateContestSchema, adjustTimingSchema, PERMISSIONS } from '@codeathon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logAudit } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.CONTESTS_VIEW),
  asyncHandler((req, res) => contestsController.getAll(req, res))
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.CONTESTS_VIEW),
  checkContestScope('id'),
  asyncHandler((req, res) => contestsController.getById(req, res))
);

router.post(
  '/',
  requirePermission(PERMISSIONS.CONTESTS_CREATE),
  validateBody(createContestSchema),
  logAudit('CONTEST_CREATED', (req) => ({ contestTitle: req.body.title })),
  asyncHandler((req, res) => contestsController.create(req, res))
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.CONTESTS_UPDATE),
  checkContestScope('id'),
  validateBody(updateContestSchema),
  logAudit('CONTEST_UPDATED', (req) => ({ contestId: req.params.id })),
  asyncHandler((req, res) => contestsController.update(req, res))
);

router.patch(
  '/:id/toggle-status',
  requirePermission(PERMISSIONS.CONTESTS_UPDATE),
  checkContestScope('id'),
  logAudit('CONTEST_STATUS_TOGGLED', (req) => ({ contestId: req.params.id, isTurnedOff: req.body.isTurnedOff })),
  asyncHandler((req, res) => contestsController.toggleStatus(req, res))
);

router.post(
  '/:id/timing',
  requirePermission(PERMISSIONS.CONTESTS_ADJUST_TIMING),
  checkContestScope('id'),
  validateBody(adjustTimingSchema),
  logAudit('CONTEST_TIMING_ADJUSTED', (req) => ({
    contestId: req.params.id,
    extensionMinutes: req.body.extensionMinutes,
    reason: req.body.reason,
  })),
  asyncHandler((req, res) => contestsController.adjustTiming(req, res))
);

router.post(
  '/:id/duplicate',
  requirePermission(PERMISSIONS.CONTESTS_CREATE),
  logAudit('CONTEST_DUPLICATED', (req) => ({ originalId: req.params.id })),
  asyncHandler((req, res) => contestsController.duplicate(req, res))
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.CONTESTS_DELETE),
  checkContestScope('id'),
  logAudit('CONTEST_DELETED', (req) => ({ contestId: req.params.id })),
  asyncHandler((req, res) => contestsController.delete(req, res))
);

export default router;
