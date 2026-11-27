import { BaseRepository } from '../../utils/baseRepository.js';

class ContestRepository extends BaseRepository {
  constructor() {
    super('contests');
  }

  async findActiveContests() {
    return this.find({ status: { $in: ['scheduled', 'live'] } });
  }
}

export const contestRepository = new ContestRepository();
