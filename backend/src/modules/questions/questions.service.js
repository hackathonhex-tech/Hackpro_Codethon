import { questionRepository } from './questions.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { v4 as uuidv4 } from 'uuid';

export class QuestionsService {
  async getQuestionsByContest(contestId, isStudent = false) {
    const list = await questionRepository.findByContest(contestId);
    if (!isStudent) return list;

    // Filter out secrets for students
    return list.map((q) => this.sanitizeForStudent(q));
  }

  async getQuestionById(id, isStudent = false) {
    const q = await questionRepository.findById(id);
    if (!q) throw ApiError.notFound('Question not found');
    if (!isStudent) return q;
    return this.sanitizeForStudent(q);
  }

  sanitizeForStudent(q) {
    if (q.type === 'mcq') {
      const rawOpts = q.mcqOptions || q.options || [];
      return {
        id: q.id,
        contestId: q.contestId,
        sectionId: q.sectionId,
        type: 'mcq',
        title: q.title,
        statement: q.statement,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        order: q.order,
        isMultiSelect: q.isMultiSelect,
        mcqOptions: rawOpts.map((opt, idx) => ({
          id: opt.id || String(idx),
          text: opt.text || opt.title || '',
        })),
      };
    }

    if (q.type === 'coding') {
      const cfg = q.codingConfig || {};
      const toggles = cfg.displayToggles || {};
      const allTestCases = cfg.testCases || [];
      const sampleTestCases = allTestCases
        .filter((tc) => tc.isSample)
        .map((tc) => ({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          explanation: tc.explanation,
        }));
      const hiddenCount = allTestCases.filter((tc) => tc.isHidden).length;

      return {
        id: q.id,
        contestId: q.contestId,
        sectionId: q.sectionId,
        type: 'coding',
        title: q.title,
        statement: toggles.showStatement !== false ? q.statement : '',
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        order: q.order,
        codingConfig: {
          inputFormat: toggles.showInputFormat !== false ? cfg.inputFormat : '',
          outputFormat: toggles.showOutputFormat !== false ? cfg.outputFormat : '',
          examples: toggles.showExamples !== false ? cfg.examples : '',
          constraints: toggles.showConstraints !== false ? cfg.constraints : '',
          timeLimitMs: toggles.showLimits !== false ? cfg.timeLimitMs : 2000,
          memoryLimitMb: toggles.showLimits !== false ? cfg.memoryLimitMb : 256,
          displayToggles: toggles,
          allowedLanguages: cfg.allowedLanguages || ['python', 'javascript', 'cpp', 'java'],
          starterCode: cfg.starterCode || {},
          sampleTestCases: toggles.showSampleTestCases !== false ? sampleTestCases : [],
          hiddenTestCasesCount: toggles.showHiddenTestCasesCount !== false ? hiddenCount : 0,
        },
      };
    }

    return q;
  }

  async createQuestion(data) {
    // Generate IDs for mcq options and test cases if missing
    let mcqOptions = data.mcqOptions;
    if (mcqOptions && Array.isArray(mcqOptions)) {
      mcqOptions = mcqOptions.map((opt) => ({
        ...opt,
        id: opt.id || uuidv4(),
      }));
    }

    let codingConfig = data.codingConfig;
    if (codingConfig && codingConfig.testCases) {
      codingConfig.testCases = codingConfig.testCases.map((tc) => ({
        ...tc,
        id: tc.id || uuidv4(),
      }));
    }

    return questionRepository.create({
      ...data,
      mcqOptions,
      codingConfig,
    });
  }

  async updateQuestion(id, updates) {
    const q = await questionRepository.findById(id);
    if (!q) throw ApiError.notFound('Question not found');

    const merged = { ...updates };
    if (updates.codingConfig && q.codingConfig) {
      merged.codingConfig = {
        ...q.codingConfig,
        ...updates.codingConfig,
        starterCode: {
          ...(q.codingConfig.starterCode || {}),
          ...(updates.codingConfig.starterCode || {}),
        },
        displayToggles: {
          ...(q.codingConfig.displayToggles || {}),
          ...(updates.codingConfig.displayToggles || {}),
        },
      };
    }

    return questionRepository.update(id, merged);
  }

  async toggleFieldDisplay(id, toggleUpdates) {
    const q = await questionRepository.findById(id);
    if (!q) throw ApiError.notFound('Question not found');
    if (q.type !== 'coding' || !q.codingConfig) {
      throw ApiError.badRequest('Field toggles only apply to coding questions');
    }

    const currentToggles = q.codingConfig.displayToggles || {};
    const updatedCodingConfig = {
      ...q.codingConfig,
      displayToggles: {
        ...currentToggles,
        ...toggleUpdates,
      },
    };

    return questionRepository.update(id, { codingConfig: updatedCodingConfig });
  }

  async bulkImport(contestId, sectionId, questionsList) {
    const created = [];
    for (const q of questionsList) {
      const item = await this.createQuestion({
        ...q,
        contestId,
        sectionId,
      });
      created.push(item);
    }
    return created;
  }

  async deleteQuestion(id) {
    const q = await questionRepository.findById(id);
    if (!q) throw ApiError.notFound('Question not found');
    return questionRepository.delete(id);
  }
}

export const questionsService = new QuestionsService();
