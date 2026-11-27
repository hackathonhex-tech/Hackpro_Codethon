import { Router } from 'express';
import { questionsController } from './questions.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createQuestionSchema, updateQuestionSchema, bulkImportQuestionsSchema, PERMISSIONS } from '@codeathon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logAudit } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/contest/:contestId',
  asyncHandler((req, res) => questionsController.getByContest(req, res))
);

router.get(
  '/:id',
  asyncHandler((req, res) => questionsController.getById(req, res))
);

router.post(
  '/',
  requirePermission(PERMISSIONS.QUESTIONS_CREATE),
  validateBody(createQuestionSchema),
  logAudit('QUESTION_CREATED', (req) => ({ contestId: req.body.contestId, title: req.body.title })),
  asyncHandler((req, res) => questionsController.create(req, res))
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.QUESTIONS_UPDATE),
  validateBody(updateQuestionSchema),
  asyncHandler((req, res) => questionsController.update(req, res))
);

router.patch(
  '/:id/toggles',
  requirePermission(PERMISSIONS.QUESTIONS_TOGGLE_FIELDS),
  logAudit('QUESTION_TOGGLES_CHANGED', (req) => ({ questionId: req.params.id, toggles: req.body })),
  asyncHandler((req, res) => questionsController.toggleFieldDisplay(req, res))
);

router.post(
  '/bulk-import',
  requirePermission(PERMISSIONS.QUESTIONS_CREATE),
  validateBody(bulkImportQuestionsSchema),
  logAudit('QUESTIONS_BULK_IMPORTED', (req) => ({ contestId: req.body.contestId })),
  asyncHandler((req, res) => questionsController.bulkImport(req, res))
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.QUESTIONS_DELETE),
  logAudit('QUESTION_DELETED', (req) => ({ questionId: req.params.id })),
  asyncHandler((req, res) => questionsController.delete(req, res))
);

export default router;
