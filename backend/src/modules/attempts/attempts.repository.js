import { BaseRepository } from '../../utils/baseRepository.js';

class AttemptRepository extends BaseRepository {
  constructor() {
    super('attempts');
  }

  async findByContestAndUser(contestId, userId) {
    return this.findOne({ contestId, userId });
  }

  async findActiveByContest(contestId) {
    return this.find({ contestId, status: 'in_progress' });
  }

  async findSubmittedByContest(contestId) {
    return this.find({ contestId, status: 'submitted' });
  }
}

export const attemptRepository = new AttemptRepository();
