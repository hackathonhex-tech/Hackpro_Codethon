import { leaderboardService } from './leaderboard.service.js';
import { successResponse } from '../../utils/response.js';
import { SYSTEM_ROLES } from '@codeathon/shared';

export class LeaderboardController {
  async getByContest(req, res) {
    const isStudent = req.user?.role === SYSTEM_ROLES.STUDENT;
    const result = await leaderboardService.getLeaderboard(req.params.contestId, isStudent);
    return successResponse(res, result);
  }
}

export const leaderboardController = new LeaderboardController();
