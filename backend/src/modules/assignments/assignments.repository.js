import { BaseRepository } from '../../utils/baseRepository.js';

class ContestAssignmentRepository extends BaseRepository {
  constructor() {
    super('contest_assignments');
  }

  async findByContest(contestId) {
    return this.find({ contestId });
  }

  async findByParticipant(participantId) {
    return this.find({ participantId });
  }

  async isAssigned(contestId, participantId, teamId = null) {
    const direct = await this.findOne({ contestId, participantId });
    if (direct) return true;
    if (teamId) {
      const teamAssignment = await this.findOne({ contestId, teamId });
      if (teamAssignment) return true;
    }
    return false;
  }
}

export const assignmentRepository = new ContestAssignmentRepository();
