import { BaseRepository } from '../../utils/baseRepository.js';

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super('refresh_tokens');
  }

  async findByToken(token) {
    return this.findOne({ token });
  }

  async revokeToken(token) {
    const record = await this.findByToken(token);
    if (record) {
      await this.update(record.id, { isRevoked: true });
    }
  }

  async revokeAllForUser(userId) {
    const all = await this.find({ userId });
    for (const record of all) {
      await this.update(record.id, { isRevoked: true });
    }
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
