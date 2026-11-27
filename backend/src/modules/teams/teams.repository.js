import { BaseRepository } from '../../utils/baseRepository.js';

class TeamRepository extends BaseRepository {
  constructor() {
    super('teams');
  }
}

export const teamRepository = new TeamRepository();
