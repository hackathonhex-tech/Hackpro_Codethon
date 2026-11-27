import { BaseRepository } from '../../utils/baseRepository.js';

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    if (!email) return null;
    return this.findOne({ email: email.toLowerCase() });
  }

  async findByIdentifier(identifier) {
    if (!identifier) return null;
    const raw = String(identifier).trim();
    const lower = raw.toLowerCase();
    const all = await this.find({});

    // 1. Direct match by email, rollNumber, id, _id
    let user = all.find(
      (u) =>
        (u.email && u.email.toLowerCase() === lower) ||
        (u.rollNumber && u.rollNumber.toLowerCase() === lower) ||
        String(u.id || '').toLowerCase() === lower ||
        String(u._id || '').toLowerCase() === lower
    );
    if (user) return user;

    // 2. Rebrand / Domain alias matches
    // e.g. admin@hackpro.dev <-> admin
    const localPart = lower.includes('@') ? lower.split('@')[0] : lower;

    if (localPart === 'superadmin' || localPart === 'super_admin' || lower === 'superadmin') {
      user = all.find((u) => u.role === 'super_admin' || (u.email && u.email.toLowerCase().includes('superadmin')));
      if (user) return user;
    }

    if (localPart === 'admin' || lower === 'admin') {
      user = all.find((u) => u.role === 'admin' || (u.email && u.email.toLowerCase().includes('admin@')));
      if (user) return user;
    }

    // Try matching any user whose email starts with localPart + '@'
    user = all.find((u) => u.email && u.email.toLowerCase().startsWith(`${localPart}@`));
    if (user) return user;

    return null;
  }
}

export const userRepository = new UserRepository();
