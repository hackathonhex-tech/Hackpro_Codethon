import { rubricRepository } from './rubrics.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { v4 as uuidv4 } from 'uuid';

export class RubricsService {
  async getAllRubrics() {
    return rubricRepository.find({});
  }

  async getRubricById(id) {
    const rubric = await rubricRepository.findById(id);
    if (!rubric) throw ApiError.notFound('Rubric not found');
    return rubric;
  }

  async createRubric(data) {
    const criteria = (data.criteria || []).map((c) => ({
      id: c.id || uuidv4(),
      name: c.name?.trim() || 'Criterion',
      weight: Number(c.weight) || 0,
    }));

    const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight), 0);
    if (Math.round(totalWeight) !== 100) {
      throw ApiError.badRequest(`Criteria weights must sum to exactly 100%. Current sum: ${totalWeight}%`);
    }

    return rubricRepository.create({
      name: data.name?.trim(),
      description: data.description?.trim() || '',
      criteria,
      isPredefined: false,
    });
  }

  async cloneRubric(id, newName) {
    const original = await rubricRepository.findById(id);
    if (!original) throw ApiError.notFound('Original rubric not found');

    return rubricRepository.create({
      name: newName || `${original.name} (Copy)`,
      description: original.description,
      criteria: (original.criteria || []).map((c) => ({ id: uuidv4(), name: c.name, weight: c.weight })),
      isPredefined: false,
    });
  }

  async updateRubric(id, updates) {
    const rubric = await rubricRepository.findById(id);
    if (!rubric) throw ApiError.notFound('Rubric not found');

    if (updates.criteria) {
      const criteria = updates.criteria.map((c) => ({
        id: c.id || uuidv4(),
        name: c.name?.trim() || 'Criterion',
        weight: Number(c.weight) || 0,
      }));
      const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight), 0);
      if (Math.round(totalWeight) !== 100) {
        throw ApiError.badRequest(`Criteria weights must sum to exactly 100%. Current sum: ${totalWeight}%`);
      }
      updates.criteria = criteria;
    }

    return rubricRepository.update(id, updates);
  }

  async deleteRubric(id) {
    const rubric = await rubricRepository.findById(id);
    if (!rubric) throw ApiError.notFound('Rubric not found');
    return rubricRepository.delete(id);
  }
}

export const rubricsService = new RubricsService();
