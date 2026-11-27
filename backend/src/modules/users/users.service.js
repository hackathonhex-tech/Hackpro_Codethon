import { userRepository } from './users.repository.js';
import { roleRepository } from '../roles/roles.repository.js';
import { hashPassword } from '../../utils/password.js';
import { ApiError } from '../../utils/ApiError.js';
import { SYSTEM_ROLES } from '@codeathon/shared';
import { env } from '../../config/env.js';

export class UsersService {
  async getAllUsers(options = {}) {
    let users = await userRepository.find({});
    // Exclude student accounts from the staff administration list unless explicitly requested
    if (options.role) {
      users = users.filter((u) => u.role === options.role || u.roleId === options.role);
    } else if (!options.includeStudents) {
      users = users.filter(
        (u) =>
          u.role !== SYSTEM_ROLES.STUDENT &&
          u.roleId !== SYSTEM_ROLES.STUDENT &&
          String(u.roleName || '').toLowerCase() !== 'student'
      );
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      users = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return users.map((u) => {
      const { password, ...safeUser } = u;
      return safeUser;
    });
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User not found');
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async createUser(data) {
    const emailLower = data.email.toLowerCase().trim();
    const existing = await userRepository.findByEmail(emailLower);

    const roleKey = data.roleId || data.role || SYSTEM_ROLES.ADMIN;
    let role = await roleRepository.findById(roleKey);
    if (!role) {
      const normalizedKey = String(roleKey).toLowerCase().replace(/\s+/g, '_');
      role = await roleRepository.findById(normalizedKey);
    }
    if (!role) {
      role = await roleRepository.findOne({ name: { $regex: new RegExp(`^${roleKey}$`, 'i') } });
    }
    if (!role) {
      role = await roleRepository.findById(SYSTEM_ROLES.ADMIN);
    }
    if (!role) {
      throw ApiError.badRequest('Specified role does not exist');
    }

    const hashedPassword = await hashPassword(data.password);

    if (existing) {
      // If user already exists (e.g. from candidate roster or previous registration), update their staff credentials & role
      const updated = await userRepository.update(existing.id, {
        name: data.name || existing.name,
        password: hashedPassword,
        role: role.id === SYSTEM_ROLES.SUPER_ADMIN ? SYSTEM_ROLES.SUPER_ADMIN : (role.id === SYSTEM_ROLES.ADMIN ? SYSTEM_ROLES.ADMIN : 'sub_role'),
        roleId: role.id,
        roleName: role.name,
        contestScope: data.contestScope || existing.contestScope || [],
        isActive: true,
      });
      const { password, ...safeUser } = updated;
      return safeUser;
    }

    const created = await userRepository.create({
      name: data.name,
      email: emailLower,
      password: hashedPassword,
      role: role.id === SYSTEM_ROLES.SUPER_ADMIN ? SYSTEM_ROLES.SUPER_ADMIN : (role.id === SYSTEM_ROLES.ADMIN ? SYSTEM_ROLES.ADMIN : 'sub_role'),
      roleId: role.id,
      roleName: role.name,
      contestScope: data.contestScope || [],
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    const { password, ...safeUser } = created;
    return safeUser;
  }

  async updateUser(id, updates) {
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User not found');

    const updateData = { ...updates };
    if (updates.password) {
      updateData.password = await hashPassword(updates.password);
    }
    if (updates.role) {
      const role = await roleRepository.findById(updates.role);
      if (!role) throw ApiError.badRequest('Specified role does not exist');
      updateData.roleId = role.id;
      updateData.roleName = role.name;
      updateData.role = role.id === SYSTEM_ROLES.SUPER_ADMIN ? SYSTEM_ROLES.SUPER_ADMIN : (role.id === SYSTEM_ROLES.ADMIN ? SYSTEM_ROLES.ADMIN : 'sub_role');
    }

    const updated = await userRepository.update(id, updateData);
    const { password, ...safeUser } = updated;
    return safeUser;
  }

  async deleteUser(id) {
    let user = await userRepository.findById(id);
    if (!user) {
      const all = await userRepository.find({});
      user = all.find((u) => u.id === id || u._id === id || String(u.id) === String(id) || String(u._id) === String(id));
    }
    if (!user) throw ApiError.notFound('Staff user not found');
    const isSuper =
      user.role === SYSTEM_ROLES.SUPER_ADMIN ||
      String(user.roleName || '').toLowerCase().includes('super') ||
      user.email === env.SUPER_ADMIN_EMAIL;
    if (isSuper) {
      throw ApiError.badRequest('Cannot delete Super Admin account');
    }
    await userRepository.delete(user.id || user._id);
    return { success: true, message: 'User deleted successfully' };
  }
}

export const usersService = new UsersService();
