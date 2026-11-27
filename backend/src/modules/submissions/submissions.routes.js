import { Router } from 'express';
import { submissionsController } from './submissions.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission, requireSuperAdmin } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { revokeSubmissionSchema, PERMISSIONS } from '@codeathon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.SUBMISSIONS_VIEW),
  asyncHandler((req, res) => submissionsController.getLocked(req, res))
);

router.post(
  '/revoke',
  requireSuperAdmin(),
  validateBody(revokeSubmissionSchema),
  asyncHandler((req, res) => submissionsController.revoke(req, res))
);

export default router;
