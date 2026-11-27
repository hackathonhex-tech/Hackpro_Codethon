import { BaseRepository } from '../../utils/baseRepository.js';

class RubricRepository extends BaseRepository {
  constructor() {
    super('rubrics');
  }
}

export const rubricRepository = new RubricRepository();
