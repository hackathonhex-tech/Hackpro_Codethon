import { Router } from 'express';
import { proctoringController } from './proctoring.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { logProctorEventSchema, PERMISSIONS } from '@codeathon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authMiddleware);

// Student logs violation event
router.post(
  '/events',
  validateBody(logProctorEventSchema),
  asyncHandler((req, res) => proctoringController.logEvent(req, res))
);

// Admin views live feed
router.get(
  '/feed',
  requirePermission(PERMISSIONS.PROCTORING_VIEW),
  asyncHandler((req, res) => proctoringController.getFeed(req, res))
);

router.get(
  '/attempt/:attemptId',
  requirePermission(PERMISSIONS.PROCTORING_VIEW),
  asyncHandler((req, res) => proctoringController.getAttemptEvents(req, res))
);

export default router;
