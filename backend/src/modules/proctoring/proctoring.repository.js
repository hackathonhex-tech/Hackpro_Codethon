import { BaseRepository } from '../../utils/baseRepository.js';

class ProctorEventRepository extends BaseRepository {
  constructor() {
    super('proctor_events');
  }

  async findByAttempt(attemptId) {
    const list = await this.find({ attemptId });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findByContest(contestId, limit = 200) {
    const list = await this.find({ contestId });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list.slice(0, limit);
  }

  async countByAttempt(attemptId) {
    return this.count({ attemptId });
  }
}

export const proctorEventRepository = new ProctorEventRepository();
