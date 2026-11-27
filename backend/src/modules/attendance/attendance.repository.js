import { BaseRepository } from '../../utils/baseRepository.js';

class AttendanceRepository extends BaseRepository {
  constructor() {
    super('attendance');
  }

  async findByContestAndUser(contestId, userId) {
    return this.findOne({ contestId, userId });
  }

  async findByContest(contestId) {
    return this.find({ contestId });
  }
}

export const attendanceRepository = new AttendanceRepository();
