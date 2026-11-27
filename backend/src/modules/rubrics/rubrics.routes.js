import { Router } from 'express';
import { rubricsController } from './rubrics.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createRubricSchema, updateRubricSchema, PERMISSIONS } from '@codeathon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logAudit } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.RUBRICS_VIEW),
  asyncHandler((req, res) => rubricsController.getAll(req, res))
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.RUBRICS_VIEW),
  asyncHandler((req, res) => rubricsController.getById(req, res))
);

router.post(
  '/',
  requirePermission(PERMISSIONS.RUBRICS_CREATE),
  validateBody(createRubricSchema),
  logAudit('RUBRIC_CREATED', (req) => ({ rubricName: req.body.name })),
  asyncHandler((req, res) => rubricsController.create(req, res))
);

router.post(
  '/:id/clone',
  requirePermission(PERMISSIONS.RUBRICS_CREATE),
  logAudit('RUBRIC_CLONED', (req) => ({ originalId: req.params.id })),
  asyncHandler((req, res) => rubricsController.clone(req, res))
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.RUBRICS_UPDATE),
  validateBody(updateRubricSchema),
  asyncHandler((req, res) => rubricsController.update(req, res))
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.RUBRICS_DELETE),
  logAudit('RUBRIC_DELETED', (req) => ({ rubricId: req.params.id })),
  asyncHandler((req, res) => rubricsController.delete(req, res))
);

export default router;
