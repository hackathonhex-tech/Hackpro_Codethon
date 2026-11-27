import { Router } from 'express';
import { sectionsController } from './sections.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { sectionSchema, PERMISSIONS } from '@codeathon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logAudit } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/contest/:contestId',
  requirePermission(PERMISSIONS.QUESTIONS_VIEW),
  asyncHandler((req, res) => sectionsController.getByContest(req, res))
);

router.post(
  '/',
  requirePermission(PERMISSIONS.QUESTIONS_CREATE),
  validateBody(sectionSchema),
  logAudit('SECTION_CREATED', (req) => ({ contestId: req.body.contestId, title: req.body.title })),
  asyncHandler((req, res) => sectionsController.create(req, res))
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.QUESTIONS_UPDATE),
  asyncHandler((req, res) => sectionsController.update(req, res))
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.QUESTIONS_DELETE),
  logAudit('SECTION_DELETED', (req) => ({ sectionId: req.params.id })),
  asyncHandler((req, res) => sectionsController.delete(req, res))
);

export default router;
