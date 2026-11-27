import { Router } from 'express';
import { participantsController } from './participants.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createParticipantSchema, updateParticipantSchema, PERMISSIONS } from '@codeathon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logAudit } from '../../middleware/audit.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.PARTICIPANTS_VIEW),
  asyncHandler((req, res) => participantsController.getAll(req, res))
);

router.get(
  '/export',
  requirePermission(PERMISSIONS.PARTICIPANTS_VIEW),
  asyncHandler((req, res) => participantsController.exportCsv(req, res))
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.PARTICIPANTS_VIEW),
  asyncHandler((req, res) => participantsController.getById(req, res))
);

router.post(
  '/',
  requirePermission(PERMISSIONS.PARTICIPANTS_CREATE),
  validateBody(createParticipantSchema),
  logAudit('PARTICIPANT_CREATED', (req) => ({ rollNumber: req.body.rollNumber })),
  asyncHandler((req, res) => participantsController.create(req, res))
);

router.post(
  '/import',
  requirePermission(PERMISSIONS.PARTICIPANTS_IMPORT_CSV),
  logAudit('PARTICIPANTS_BULK_IMPORTED'),
  asyncHandler((req, res) => participantsController.bulkImport(req, res))
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.PARTICIPANTS_UPDATE),
  validateBody(updateParticipantSchema),
  asyncHandler((req, res) => participantsController.update(req, res))
);

router.delete(
  '/all',
  requirePermission(PERMISSIONS.PARTICIPANTS_DELETE),
  logAudit('ALL_PARTICIPANTS_DELETED'),
  asyncHandler((req, res) => participantsController.deleteAll(req, res))
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.PARTICIPANTS_DELETE),
  logAudit('PARTICIPANT_DELETED', (req) => ({ participantId: req.params.id })),
  asyncHandler((req, res) => participantsController.delete(req, res))
);

export default router;
