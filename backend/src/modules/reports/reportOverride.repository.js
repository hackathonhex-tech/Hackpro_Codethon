import { BaseRepository } from '../../utils/baseRepository.js';

class ReportOverrideRepository extends BaseRepository {
  constructor() {
    super('report_overrides');
  }

  async findByContest(contestId) {
    return this.findOne({ contestId });
  }

  async resetOverrides(contestId) {
    const existing = await this.findByContest(contestId);
    if (existing) {
      return this.delete(existing.id);
    }
    return true;
  }
}

export const reportOverrideRepository = new ReportOverrideRepository();
