import { userRepository } from './users.repository.js';
import { roleRepository } from '../roles/roles.repository.js';
import { hashPassword } from '../../utils/password.js';
import { ApiError } from '../../utils/ApiError.js';
import { SYSTEM_ROLES } from '@codeathon/shared';
import { env } from '../../config/env.js';

export class UsersService {
  async getAllUsers(options = {}) {
    let users = await userRepository.find({});
    if (options.role) {
      users = users.filter((u) => u.role === options.role || u.roleId === options.role);
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
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw ApiError.conflict('A user with this email address already exists');
    }

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
    const created = await userRepository.create({
      name: data.name,
      email: data.email.toLowerCase(),
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
