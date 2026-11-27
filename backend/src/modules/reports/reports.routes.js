import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { reportOverrideSchema, PERMISSIONS } from '@codeathon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/:contestId',
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  asyncHandler((req, res) => reportsController.getReport(req, res))
);

router.post(
  '/:contestId/override',
  requirePermission(PERMISSIONS.REPORTS_EDIT_MOCK),
  validateBody(reportOverrideSchema.omit({ contestId: true })),
  asyncHandler((req, res) => reportsController.updateOverrides(req, res))
);

router.post(
  '/:contestId/reset',
  requirePermission(PERMISSIONS.REPORTS_EDIT_MOCK),
  asyncHandler((req, res) => reportsController.resetOverrides(req, res))
);

router.get(
  '/:contestId/export',
  requirePermission(PERMISSIONS.REPORTS_EXPORT),
  asyncHandler((req, res) => reportsController.exportReport(req, res))
);

export default router;
