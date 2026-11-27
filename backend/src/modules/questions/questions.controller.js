import { questionsService } from './questions.service.js';
import { successResponse } from '../../utils/response.js';
import { SYSTEM_ROLES } from '@codeathon/shared';

export class QuestionsController {
  async getByContest(req, res) {
    const isStudent = req.user?.role === SYSTEM_ROLES.STUDENT;
    const list = await questionsService.getQuestionsByContest(req.params.contestId, isStudent);
    return successResponse(res, list);
  }

  async getById(req, res) {
    const isStudent = req.user?.role === SYSTEM_ROLES.STUDENT;
    const q = await questionsService.getQuestionById(req.params.id, isStudent);
    return successResponse(res, q);
  }

  async create(req, res) {
    const q = await questionsService.createQuestion(req.body);
    return successResponse(res, q, 201);
  }

  async update(req, res) {
    const q = await questionsService.updateQuestion(req.params.id, req.body);
    return successResponse(res, q);
  }

  async toggleFieldDisplay(req, res) {
    const q = await questionsService.toggleFieldDisplay(req.params.id, req.body);
    return successResponse(res, q);
  }

  async bulkImport(req, res) {
    const { contestId, sectionId, questions } = req.body;
    const result = await questionsService.bulkImport(contestId, sectionId, questions);
    return successResponse(res, result, 201);
  }

  async delete(req, res) {
    await questionsService.deleteQuestion(req.params.id);
    return successResponse(res, { message: 'Question deleted successfully' });
  }
}

export const questionsController = new QuestionsController();
