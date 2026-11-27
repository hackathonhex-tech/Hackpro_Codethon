import { BaseRepository } from '../../utils/baseRepository.js';

class AuditRepository extends BaseRepository {
  constructor() {
    super('audit_logs');
  }

  async log(data) {
    return this.create(data);
  }

  async getRecentLogs(limit = 100) {
    const list = Array.from(this.items.values());
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list.slice(0, limit);
  }
}

export const auditRepository = new AuditRepository();
