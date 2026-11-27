import { BaseRepository } from '../../utils/baseRepository.js';

class SectionRepository extends BaseRepository {
  constructor() {
    super('sections');
  }

  async findByContest(contestId) {
    const list = await this.find({ contestId });
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}

export const sectionRepository = new SectionRepository();
