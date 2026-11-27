import { Router } from 'express';
import { leaderboardController } from './leaderboard.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/:contestId',
  asyncHandler((req, res) => leaderboardController.getByContest(req, res))
);

export default router;
