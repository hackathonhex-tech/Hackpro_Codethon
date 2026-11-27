import { sectionRepository } from './sections.repository.js';
import { questionRepository } from '../questions/questions.repository.js';
import { ApiError } from '../../utils/ApiError.js';

export class SectionsService {
  async getSectionsByContest(contestId) {
    const sections = await sectionRepository.findByContest(contestId);
    const questions = await questionRepository.findByContest(contestId);

    return sections.map((sec) => {
      const secQuestions = questions.filter((q) => q.sectionId === sec.id);
      const totalMarks = secQuestions.reduce((acc, curr) => acc + (curr.marks || 0), 0);
      return {
        ...sec,
        questionCount: secQuestions.length,
        totalMarks,
      };
    });
  }

  async createSection(data) {
    return sectionRepository.create(data);
  }

  async updateSection(id, updates) {
    const sec = await sectionRepository.findById(id);
    if (!sec) throw ApiError.notFound('Section not found');
    return sectionRepository.update(id, updates);
  }

  async deleteSection(id) {
    const sec = await sectionRepository.findById(id);
    if (!sec) throw ApiError.notFound('Section not found');
    // Also delete section questions
    const questions = await questionRepository.findBySection(id);
    for (const q of questions) {
      await questionRepository.delete(q.id);
    }
    return sectionRepository.delete(id);
  }
}

export const sectionsService = new SectionsService();
