import { proctorEventRepository } from './proctoring.repository.js';
import { attemptRepository } from '../attempts/attempts.repository.js';
import { contestRepository } from '../contests/contests.repository.js';
import { attemptsService } from '../attempts/attempts.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { PROCTOR_ACTION, ATTEMPT_STATUS } from '@codeathon/shared';
import { getSocketServer } from '../../sockets/index.js';

export class ProctoringService {
  async logEvent(contestId, user, { type, timestamp, details, attemptId }) {
    let attempt = await attemptRepository.findByContestAndUser(contestId, user.userId);
    if (!attempt && (attemptId || details?.attemptId)) {
      attempt = await attemptRepository.findById(attemptId || details?.attemptId);
    }
    if (!attempt) {
      // Fallback virtual attempt reference to ensure zero proctoring data loss
      attempt = { id: `att_${user.userId}_${contestId}`, status: ATTEMPT_STATUS.IN_PROGRESS };
    }
    if (attempt.status === ATTEMPT_STATUS.SUBMITTED) {
      return { ignored: true, reason: 'Attempt already submitted' };
    }

    const contest = await contestRepository.findById(contestId);
    const pConfig = contest?.proctorConfig || {};

    if (!pConfig.enabled) {
      return { recorded: false, message: 'Proctoring disabled for this contest' };
    }

    const event = await proctorEventRepository.create({
      contestId,
      attemptId: attempt.id,
      userId: user.userId,
      userName: user.name,
      userRoll: user.rollNumber,
      type,
      details: details || {},
      createdAt: timestamp || new Date().toISOString(),
    });

    const violationCount = await proctorEventRepository.countByAttempt(attempt.id);
    const maxViolations = pConfig.maxViolations || 5;
    const action = pConfig.violationAction || PROCTOR_ACTION.WARN_ONLY;

    let autoSubmitted = false;

    if (violationCount >= maxViolations && action === PROCTOR_ACTION.AUTO_SUBMIT) {
      await attemptsService.finishAttempt(contestId, user, 'proctor_violation_limit');
      autoSubmitted = true;
    }

    // Emit Socket.IO notification to admin monitor and student
    const io = getSocketServer();
    if (io) {
      io.to(`admin:contest:${contestId}`).emit('proctor:violation', {
        contestId,
        attemptId: attempt.id,
        userId: user.userId,
        userName: user.name,
        userRoll: user.rollNumber,
        type,
        violationCount,
        maxViolations,
        autoSubmitted,
        createdAt: event.createdAt,
      });

      io.to(`attempt:${attempt.id}`).emit('proctor:violation', {
        type,
        violationCount,
        maxViolations,
        autoSubmitted,
      });
    }

    return {
      recorded: true,
      violationCount,
      maxViolations,
      autoSubmitted,
    };
  }

  async getFeedByContest(contestId) {
    return proctorEventRepository.findByContest(contestId);
  }

  async getEventsByAttempt(attemptId) {
    return proctorEventRepository.findByAttempt(attemptId);
  }
}

export const proctoringService = new ProctoringService();
