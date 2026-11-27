import { BaseRepository } from '../../utils/baseRepository.js';

class SubmissionRepository extends BaseRepository {
  constructor() {
    super('submissions');
  }

  async findByAttempt(attemptId) {
    return this.find({ attemptId });
  }

  async findByAttemptAndQuestion(attemptId, questionId) {
    return this.find({ attemptId, questionId });
  }

  async findLatestByAttemptAndQuestion(attemptId, questionId) {
    const list = await this.find({ attemptId, questionId });
    if (!list.length) return null;
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list[0];
  }
}

export const submissionRepository = new SubmissionRepository();
