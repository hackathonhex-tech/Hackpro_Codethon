import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { authRateLimiter } from '../../middleware/rateLimit.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@codeathon/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  asyncHandler((req, res) => authController.login(req, res))
);

router.post(
  '/refresh',
  asyncHandler((req, res) => authController.refresh(req, res))
);

router.post(
  '/logout',
  asyncHandler((req, res) => authController.logout(req, res))
);

router.get(
  '/me',
  authMiddleware,
  asyncHandler((req, res) => authController.getMe(req, res))
);

router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  asyncHandler((req, res) => authController.forgotPassword(req, res))
);

router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  asyncHandler((req, res) => authController.resetPassword(req, res))
);

export default router;
