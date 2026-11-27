import { rubricsService } from './rubrics.service.js';
import { successResponse } from '../../utils/response.js';

export class RubricsController {
  async getAll(req, res) {
    const list = await rubricsService.getAllRubrics();
    return successResponse(res, list);
  }

  async getById(req, res) {
    const item = await rubricsService.getRubricById(req.params.id);
    return successResponse(res, item);
  }

  async create(req, res) {
    const item = await rubricsService.createRubric(req.body);
    return successResponse(res, item, 201);
  }

  async clone(req, res) {
    const cloned = await rubricsService.cloneRubric(req.params.id, req.body.name);
    return successResponse(res, cloned, 201);
  }

  async update(req, res) {
    const item = await rubricsService.updateRubric(req.params.id, req.body);
    return successResponse(res, item);
  }

  async delete(req, res) {
    await rubricsService.deleteRubric(req.params.id);
    return successResponse(res, { message: 'Rubric deleted successfully' });
  }
}

export const rubricsController = new RubricsController();
