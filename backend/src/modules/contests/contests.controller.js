import { contestsService } from './contests.service.js';
import { successResponse } from '../../utils/response.js';
import { getPagination } from '../../utils/pagination.js';

export class ContestsController {
  async getAll(req, res) {
    const { page, limit, skip } = getPagination(req.query);
    const all = await contestsService.getAllContests({
      status: req.query.status,
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
    const contest = await contestsService.getContestById(req.params.id);
    return successResponse(res, contest);
  }

  async create(req, res) {
    const contest = await contestsService.createContest(req.body);
    return successResponse(res, contest, 201);
  }

  async update(req, res) {
    const contest = await contestsService.updateContest(req.params.id, req.body);
    return successResponse(res, contest);
  }

  async toggleStatus(req, res) {
    const { isTurnedOff } = req.body;
    const result = await contestsService.toggleContestStatus(req.params.id, isTurnedOff);
    return successResponse(res, result);
  }

  async adjustTiming(req, res) {
    const { extensionMinutes, reason } = req.body;
    const result = await contestsService.adjustTiming(req.params.id, extensionMinutes, reason);
    return successResponse(res, result);
  }

  async duplicate(req, res) {
    const duplicated = await contestsService.duplicateContest(req.params.id);
    return successResponse(res, duplicated, 201);
  }

  async delete(req, res) {
    await contestsService.deleteContest(req.params.id);
    return successResponse(res, { message: 'Contest deleted successfully' });
  }
}

export const contestsController = new ContestsController();
