import { BaseRepository } from '../../utils/baseRepository.js';

class ParticipantRepository extends BaseRepository {
  constructor() {
    super('participants');
  }

  async findByRollNumber(rollNumber) {
    if (!rollNumber) return null;
    return this.findOne({ rollNumber: rollNumber.toUpperCase() });
  }

  async findByEmail(email) {
    if (!email) return null;
    return this.findOne({ email: email.toLowerCase() });
  }
}

export const participantRepository = new ParticipantRepository();
