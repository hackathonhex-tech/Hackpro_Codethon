import { proctoringService } from './proctoring.service.js';
import { successResponse } from '../../utils/response.js';

export class ProctoringController {
  async logEvent(req, res) {
    const contestId = req.body.contestId || req.params.contestId;
    const result = await proctoringService.logEvent(contestId, req.user, req.body);
    return successResponse(res, result, 201);
  }

  async getFeed(req, res) {
    const contestId = req.params.contestId || req.query.contestId;
    const feed = await proctoringService.getFeedByContest(contestId);
    return successResponse(res, feed);
  }

  async getAttemptEvents(req, res) {
    const events = await proctoringService.getEventsByAttempt(req.params.attemptId);
    return successResponse(res, events);
  }
}

export const proctoringController = new ProctoringController();
