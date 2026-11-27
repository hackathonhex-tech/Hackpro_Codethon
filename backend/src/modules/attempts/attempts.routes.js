import { Router } from 'express';
import { attemptsController } from './attempts.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { attemptGuard } from '../../middleware/attemptGuard.middleware.js';
import { codeRunRateLimiter } from '../../middleware/rateLimit.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { saveAnswerSchema, runCodeSchema, submitCodeSchema } from '@codeathon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authMiddleware);

// Join contest by Batch Code
router.post(
  '/join-batch',
  asyncHandler((req, res) => attemptsController.joinByBatchCode(req, res))
);

// Get assigned contests for student dashboard
router.get(
  '/',
  asyncHandler((req, res) => attemptsController.getAssignedContests(req, res))
);

// Get single contest overview details (before starting test)
router.get(
  '/:id',
  asyncHandler((req, res) => attemptsController.getContestOverview(req, res))
);

// Start contest attempt
router.post(
  '/:id/start',
  asyncHandler((req, res) => attemptsController.startAttempt(req, res))
);

// Get contest state (questions, answers, timer)
router.get(
  '/:id/state',
  asyncHandler((req, res) => attemptsController.getAttemptState(req, res))
);

// Autosave MCQ or code answers
router.post(
  '/:id/answers',
  attemptGuard,
  validateBody(saveAnswerSchema),
  asyncHandler((req, res) => attemptsController.saveAnswer(req, res))
);

// Test Run code against sample test cases (or custom input)
router.post(
  '/:id/run',
  attemptGuard,
  codeRunRateLimiter,
  validateBody(runCodeSchema),
  asyncHandler((req, res) => attemptsController.runCode(req, res))
);

// Submit code against all test cases (persisted & scored)
router.post(
  '/:id/submit-code',
  attemptGuard,
  codeRunRateLimiter,
  validateBody(submitCodeSchema),
  asyncHandler((req, res) => attemptsController.submitCode(req, res))
);

// Final submit attempt (locks test)
router.post(
  '/:id/finish',
  asyncHandler((req, res) => attemptsController.finishAttempt(req, res))
);

export default router;
