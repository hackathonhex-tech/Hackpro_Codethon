import { Router } from 'express';
import { auditRepository } from './audit.repository.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '@codeathon/shared';
import { successResponse } from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.AUDIT_LOGS_VIEW),
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit || '100', 10);
    const logs = await auditRepository.getRecentLogs(limit);
    return successResponse(res, logs);
  })
);

export default router;
