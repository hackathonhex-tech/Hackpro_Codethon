import { rolesService } from './roles.service.js';
import { successResponse } from '../../utils/response.js';

export class RolesController {
  async getAll(req, res) {
    const roles = await rolesService.getAllRoles();
    return successResponse(res, roles);
  }

  async getById(req, res) {
    const role = await rolesService.getRoleById(req.params.id);
    return successResponse(res, role);
  }

  async create(req, res) {
    const role = await rolesService.createRole(req.body);
    return successResponse(res, role, 201);
  }

  async update(req, res) {
    const role = await rolesService.updateRole(req.params.id, req.body);
    return successResponse(res, role);
  }

  async delete(req, res) {
    await rolesService.deleteRole(req.params.id);
    return successResponse(res, { message: 'Role deleted successfully' });
  }

  async getPermissions(req, res) {
    const matrix = rolesService.getPermissionMatrix();
    return successResponse(res, matrix);
  }
}

export const rolesController = new RolesController();
