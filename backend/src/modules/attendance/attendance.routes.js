import { Router } from 'express';
import { attendanceController } from './attendance.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '@codeathon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/:contestId',
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW),
  asyncHandler((req, res) => attendanceController.getByContest(req, res))
);

router.get(
  '/:contestId/export',
  requirePermission(PERMISSIONS.ATTENDANCE_EXPORT),
  asyncHandler((req, res) => attendanceController.exportCsv(req, res))
);

router.post(
  '/:contestId/mark',
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW),
  asyncHandler((req, res) => attendanceController.markAttendance(req, res))
);

export default router;
