import { contestRepository } from './contests.repository.js';
import { sectionRepository } from '../sections/sections.repository.js';
import { questionRepository } from '../questions/questions.repository.js';
import { attemptRepository } from '../attempts/attempts.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { CONTEST_STATUS } from '@codeathon/shared';
import { getSocketServer } from '../../sockets/index.js';

export class ContestsService {
  async getAllContests(query = {}) {
    let list = await contestRepository.find({});
    if (query.status) {
      list = list.filter((c) => c.status === query.status);
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)));
    }
    // Update live/ended status automatically based on current wall clock & activation mode
    const now = Date.now();
    return list.map((c) => {
      let resolvedStatus = c.status;
      const isManual = c.activationMode === 'manual';

      if (c.isTurnedOff) {
        resolvedStatus = CONTEST_STATUS.ENDED;
      } else if (isManual) {
        resolvedStatus = c.status === CONTEST_STATUS.LIVE ? CONTEST_STATUS.LIVE : c.status;
      } else if (c.status !== CONTEST_STATUS.DRAFT && c.status !== CONTEST_STATUS.ARCHIVED) {
        const start = new Date(c.startTime).getTime();
        const end = new Date(c.endTime).getTime() + (c.gracePeriodMinutes || 0) * 60 * 1000;
        if (now < start) resolvedStatus = CONTEST_STATUS.SCHEDULED;
        else if (now >= start && now <= end) resolvedStatus = CONTEST_STATUS.LIVE;
        else if (now > end) resolvedStatus = CONTEST_STATUS.ENDED;
      }
      return { ...c, computedStatus: resolvedStatus };
    });
  }

  async getContestById(id) {
    const contest = await contestRepository.findById(id);
    if (!contest) throw ApiError.notFound('Contest not found');
    const sections = await sectionRepository.findByContest(id);
    const now = Date.now();
    let resolvedStatus = contest.status;
    const isManual = contest.activationMode === 'manual';

    if (contest.isTurnedOff) {
      resolvedStatus = CONTEST_STATUS.ENDED;
    } else if (isManual) {
      resolvedStatus = (contest.status === CONTEST_STATUS.LIVE || contest.status === 'live')
        ? CONTEST_STATUS.LIVE
        : (contest.status || CONTEST_STATUS.DRAFT);
    } else if (contest.status !== CONTEST_STATUS.DRAFT && contest.status !== CONTEST_STATUS.ARCHIVED) {
      const start = contest.startTime ? new Date(contest.startTime).getTime() : 0;
      const end = contest.endTime ? new Date(contest.endTime).getTime() + (contest.gracePeriodMinutes || 0) * 60 * 1000 : 0;
      if (start && now < start) resolvedStatus = CONTEST_STATUS.SCHEDULED;
      else if (start && end && now >= start && now <= end) resolvedStatus = CONTEST_STATUS.LIVE;
      else if (end && now > end) resolvedStatus = CONTEST_STATUS.ENDED;
      else resolvedStatus = contest.status || CONTEST_STATUS.DRAFT;
    }

    return {
      ...contest,
      computedStatus: resolvedStatus,
      sections,
    };
  }

  async createContest(data) {
    const contest = await contestRepository.create({
      ...data,
      extensionSeconds: 0,
      createdAt: new Date().toISOString(),
    });
    return contest;
  }

  async updateContest(id, updates) {
    const contest = await contestRepository.findById(id);
    if (!contest) throw ApiError.notFound('Contest not found');

    const updated = await contestRepository.update(id, updates);

    // Notify connected participants of updated settings/timing
    const io = getSocketServer();
    if (io) {
      io.to(`contest:${id}`).emit('contest:settings-changed', {
        contestId: id,
        updates,
      });
      io.emit('contest:status-changed', {
        contestId: id,
        updates,
      });
    }

    return updated;
  }

  async toggleContestStatus(id, isTurnedOff) {
    const contest = await contestRepository.findById(id);
    if (!contest) throw ApiError.notFound('Contest not found');

    const willBeOff = isTurnedOff !== undefined ? Boolean(isTurnedOff) : !contest.isTurnedOff;
    const newStatus = willBeOff ? CONTEST_STATUS.ENDED : CONTEST_STATUS.LIVE;

    const updated = await contestRepository.update(id, {
      isTurnedOff: willBeOff,
      status: newStatus,
      activationMode: 'manual',
    });

    const io = getSocketServer();
    if (io) {
      const payload = {
        contestId: id,
        isTurnedOff: willBeOff,
        status: newStatus,
        activationMode: 'manual',
      };
      io.to(`contest:${id}`).emit('contest:status-changed', payload);
      io.emit('contest:status-changed', payload);
    }

    return updated;
  }

  async adjustTiming(id, extensionMinutes, reason) {
    const contest = await contestRepository.findById(id);
    if (!contest) throw ApiError.notFound('Contest not found');

    const addedSeconds = extensionMinutes * 60;
    const newExtensionSeconds = (contest.extensionSeconds || 0) + addedSeconds;

    await contestRepository.update(id, {
      extensionSeconds: newExtensionSeconds,
    });

    // Also extend active in_progress attempts
    const activeAttempts = await attemptRepository.find({ contestId: id, status: 'in_progress' });
    for (const att of activeAttempts) {
      const attExtension = (att.extensionSeconds || 0) + addedSeconds;
      await attemptRepository.update(att.id, { extensionSeconds: attExtension });
    }

    const io = getSocketServer();
    if (io) {
      io.to(`contest:${id}`).emit('timer:sync', {
        contestId: id,
        extensionSeconds: newExtensionSeconds,
        extensionMinutes,
        reason,
      });
    }

    return {
      message: `Contest duration successfully extended by ${extensionMinutes} minutes`,
      totalExtensionMinutes: Math.floor(newExtensionSeconds / 60),
    };
  }

  async duplicateContest(id) {
    const original = await contestRepository.findById(id);
    if (!original) throw ApiError.notFound('Original contest not found');

    const duplicated = await contestRepository.create({
      ...original,
      id: undefined,
      _id: undefined,
      title: `${original.title} (Copy)`,
      status: CONTEST_STATUS.DRAFT,
      createdAt: new Date().toISOString(),
    });

    // Duplicate sections and questions
    const sections = await sectionRepository.findByContest(id);
    for (const sec of sections) {
      const newSec = await sectionRepository.create({
        ...sec,
        id: undefined,
        _id: undefined,
        contestId: duplicated.id,
      });

      const questions = await questionRepository.findBySection(sec.id);
      for (const q of questions) {
        await questionRepository.create({
          ...q,
          id: undefined,
          _id: undefined,
          contestId: duplicated.id,
          sectionId: newSec.id,
        });
      }
    }

    return duplicated;
  }

  async deleteContest(id) {
    const contest = await contestRepository.findById(id);
    if (!contest) throw ApiError.notFound('Contest not found');
    return contestRepository.delete(id);
  }
}

export const contestsService = new ContestsService();
