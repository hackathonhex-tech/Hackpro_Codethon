import { invitationsService } from './invitations.service.js';
import { successResponse } from '../../utils/response.js';

export class InvitationsController {
  async getStatus(req, res) {
    const { contestId } = req.params;
    const result = await invitationsService.getContestParticipantsWithInvitationStatus(contestId);
    return successResponse(res, result);
  }

  async send(req, res) {
    const { contestId } = req.params;
    const { participantIds } = req.body || {};
    const result = await invitationsService.sendInvitations(contestId, req.user, { participantIds });
    return successResponse(res, result, 200);
  }

  async resendFailed(req, res) {
    const { contestId } = req.params;
    const result = await invitationsService.resendFailedInvitations(contestId, req.user);
    return successResponse(res, result, 200);
  }
}

export const invitationsController = new InvitationsController();
