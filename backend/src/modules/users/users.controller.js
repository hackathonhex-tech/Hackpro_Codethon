import { usersService } from './users.service.js';
import { successResponse } from '../../utils/response.js';
import { getPagination } from '../../utils/pagination.js';

export class UsersController {
  async getAll(req, res) {
    const { page, limit, skip, formatResponse } = getPagination(req.query);
    const all = await usersService.getAllUsers({
      role: req.query.role,
      search: req.query.search,
    });
    const items = all.slice(skip, skip + limit);
    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total: all.length,
        totalPages: Math.ceil(all.length / limit) || 1,
      },
    });
  }

  async getById(req, res) {
    const user = await usersService.getUserById(req.params.id);
    return successResponse(res, user);
  }

  async create(req, res) {
    const user = await usersService.createUser(req.body);
    return successResponse(res, user, 201);
  }

  async update(req, res) {
    const user = await usersService.updateUser(req.params.id, req.body);
    return successResponse(res, user);
  }

  async delete(req, res) {
    await usersService.deleteUser(req.params.id);
    return successResponse(res, { message: 'User deleted successfully' });
  }
}

export const usersController = new UsersController();
