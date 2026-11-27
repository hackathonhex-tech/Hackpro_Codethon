import { roleRepository } from './roles.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { MODULE_PERMISSIONS, ALL_PERMISSIONS } from '@codeathon/shared';

export class RolesService {
  async getAllRoles() {
    return roleRepository.find({});
  }

  async getRoleById(id) {
    const role = await roleRepository.findById(id);
    if (!role) throw ApiError.notFound('Role not found');
    return role;
  }

  async createRole(data) {
    const existing = await roleRepository.findOne({ name: data.name });
    if (existing) {
      throw ApiError.conflict('A role with this name already exists');
    }

    return roleRepository.create({
      ...data,
      isSystem: false,
    });
  }

  async updateRole(id, updates) {
    const role = await roleRepository.findById(id);
    if (!role) throw ApiError.notFound('Role not found');
    if (role.isSystem && updates.name && updates.name !== role.name) {
      throw ApiError.badRequest('Cannot rename a protected system role');
    }

    return roleRepository.update(id, updates);
  }

  async deleteRole(id) {
    const role = await roleRepository.findById(id);
    if (!role) throw ApiError.notFound('Role not found');
    if (role.isSystem) {
      throw ApiError.badRequest('System roles cannot be deleted');
    }
    return roleRepository.delete(id);
  }

  getPermissionMatrix() {
    return {
      modules: MODULE_PERMISSIONS,
      allKeys: ALL_PERMISSIONS,
    };
  }
}

export const rolesService = new RolesService();
