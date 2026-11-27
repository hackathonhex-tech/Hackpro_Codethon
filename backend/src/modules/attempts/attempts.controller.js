import { attemptsService } from './attempts.service.js';
import { successResponse } from '../../utils/response.js';

export class AttemptsController {
  async joinByBatchCode(req, res) {
    const { batchCode } = req.body;
    const result = await attemptsService.joinByBatchCode(batchCode, req.user);
    return successResponse(res, result);
  }

  async getAssignedContests(req, res) {
    const list = await attemptsService.getAssignedContests(req.user);
    return successResponse(res, list);
  }

  async getContestOverview(req, res) {
    const contestId = req.params.id;
    const overview = await attemptsService.getContestOverview(contestId, req.user);
    return successResponse(res, overview);
  }

  async startAttempt(req, res) {
    const contestId = req.params.id;
    const attempt = await attemptsService.startAttempt(contestId, req.user);
    return successResponse(res, attempt);
  }

  async getAttemptState(req, res) {
    const contestId = req.params.id;
    const state = await attemptsService.getAttemptState(contestId, req.user);
    return successResponse(res, state);
  }

  async saveAnswer(req, res) {
    const contestId = req.params.id;
    const result = await attemptsService.saveAnswer(contestId, req.user, req.body);
    return successResponse(res, result);
  }

  async runCode(req, res) {
    const contestId = req.params.id;
    const result = await attemptsService.runCode(contestId, req.user, req.body);
    return successResponse(res, result);
  }

  async submitCode(req, res) {
    const contestId = req.params.id;
    const result = await attemptsService.submitCode(contestId, req.user, req.body);
    return successResponse(res, result);
  }

  async finishAttempt(req, res) {
    const contestId = req.params.id;
    const reason = req.body.reason || 'user_submit';
    const result = await attemptsService.finishAttempt(contestId, req.user, reason);
    return successResponse(res, result);
  }
}

export const attemptsController = new AttemptsController();
