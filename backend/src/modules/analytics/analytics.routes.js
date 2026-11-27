import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '@codeathon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/dashboard',
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  asyncHandler((req, res) => analyticsController.getDashboard(req, res))
);

router.get(
  '/export',
  requirePermission(PERMISSIONS.DASHBOARD_EXPORT),
  asyncHandler((req, res) => analyticsController.exportCsv(req, res))
);

export default router;
