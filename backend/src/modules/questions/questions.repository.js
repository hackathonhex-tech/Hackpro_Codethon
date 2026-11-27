import { BaseRepository } from '../../utils/baseRepository.js';

class QuestionRepository extends BaseRepository {
  constructor() {
    super('questions');
  }

  async findByContest(contestId) {
    const list = await this.find({ contestId });
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async findBySection(sectionId) {
    const list = await this.find({ sectionId });
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}

export const questionRepository = new QuestionRepository();
