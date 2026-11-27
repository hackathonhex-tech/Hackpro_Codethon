import { BaseRepository } from '../../utils/baseRepository.js';

class AnswerRepository extends BaseRepository {
  constructor() {
    super('answers');
  }

  async findByAttemptAndQuestion(attemptId, questionId) {
    return this.findOne({ attemptId, questionId });
  }

  async findByAttempt(attemptId) {
    return this.find({ attemptId });
  }

  async upsertAnswer(attemptId, questionId, data) {
    const existing = await this.findByAttemptAndQuestion(attemptId, questionId);
    if (existing) {
      return this.update(existing.id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    }
    return this.create({
      attemptId,
      questionId,
      ...data,
      createdAt: new Date().toISOString(),
    });
  }
}

export const answerRepository = new AnswerRepository();
