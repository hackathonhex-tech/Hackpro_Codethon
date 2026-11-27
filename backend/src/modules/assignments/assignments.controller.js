import { assignmentsService } from './assignments.service.js';
import { successResponse } from '../../utils/response.js';

export class AssignmentsController {
  async getByContest(req, res) {
    const list = await assignmentsService.getAssignmentsByContest(req.params.contestId);
    return successResponse(res, list);
  }

  async assign(req, res) {
    const { contestId, participantIds, teamIds } = req.body;
    const result = await assignmentsService.assign(contestId, participantIds, teamIds);
    return successResponse(res, result, 201);
  }

  async unassign(req, res) {
    const { contestId, participantId, teamId } = req.body;
    await assignmentsService.unassign(contestId, participantId, teamId);
    return successResponse(res, { message: 'Unassigned successfully' });
  }
}

export const assignmentsController = new AssignmentsController();
