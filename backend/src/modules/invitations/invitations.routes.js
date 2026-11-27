import { Router } from 'express';
import { invitationsController } from './invitations.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get(
  '/',
  requirePermission('contests.view'),
  asyncHandler((req, res) => invitationsController.getStatus(req, res))
);

router.post(
  '/send',
  requirePermission('contests.edit'),
  asyncHandler((req, res) => invitationsController.send(req, res))
);

router.post(
  '/resend-failed',
  requirePermission('contests.edit'),
  asyncHandler((req, res) => invitationsController.resendFailed(req, res))
);

export default router;
