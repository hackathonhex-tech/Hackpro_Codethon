import { sectionsService } from './sections.service.js';
import { successResponse } from '../../utils/response.js';

export class SectionsController {
  async getByContest(req, res) {
    const sections = await sectionsService.getSectionsByContest(req.params.contestId);
    return successResponse(res, sections);
  }

  async create(req, res) {
    const sec = await sectionsService.createSection(req.body);
    return successResponse(res, sec, 201);
  }

  async update(req, res) {
    const sec = await sectionsService.updateSection(req.params.id, req.body);
    return successResponse(res, sec);
  }

  async delete(req, res) {
    await sectionsService.deleteSection(req.params.id);
    return successResponse(res, { message: 'Section deleted successfully' });
  }
}

export const sectionsController = new SectionsController();
