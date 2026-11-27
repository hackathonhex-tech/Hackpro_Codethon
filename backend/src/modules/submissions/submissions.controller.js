import { submissionsService } from './submissions.service.js';
import { successResponse } from '../../utils/response.js';

export class SubmissionsController {
  async getLocked(req, res) {
    const result = await submissionsService.getLockedSubmissions(req.query.contestId, req.query);
    return res.status(200).json({
      success: true,
      data: result.data || result,
      pagination: result.pagination || null,
    });
  }

  async revoke(req, res) {
    const result = await submissionsService.revokeSubmission(req.user, req.body);
    return successResponse(res, result);
  }
}

export const submissionsController = new SubmissionsController();
