import { ApiError } from '../utils/ApiError.js';
import { ATTEMPT_STATUS } from '@codeathon/shared';
import { attemptRepository } from '../modules/attempts/attempts.repository.js';
import { contestRepository } from '../modules/contests/contests.repository.js';
import { calculateAttemptTiming } from '../utils/time.js';

export const attemptGuard = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const contestId = req.params.contestId || req.body.contestId || req.params.id;

    if (!userId || !contestId) {
      return next(ApiError.badRequest('Missing user or contest ID for attempt guard'));
    }

    const attempt = await attemptRepository.findByContestAndUser(contestId, userId);
    if (!attempt) {
      return next(ApiError.notFound('Test attempt has not been started yet. Please click Start Test.', 'ATTEMPT_NOT_FOUND'));
    }

    if (attempt.status === ATTEMPT_STATUS.SUBMITTED) {
      return next(ApiError.attemptLocked());
    }

    const contest = await contestRepository.findById(contestId);
    if (!contest) {
      return next(ApiError.notFound('Contest not found', 'CONTEST_NOT_FOUND'));
    }

    const timing = calculateAttemptTiming(
      attempt.startedAt,
      contest.durationMinutes,
      contest.endTime,
      contest.gracePeriodMinutes || 0,
      attempt.extensionSeconds || 0
    );

    if (timing.isExpired) {
      // Mark as submitted / timed out
      await attemptRepository.update(attempt.id, {
        status: ATTEMPT_STATUS.SUBMITTED,
        submittedAt: new Date().toISOString(),
        submissionReason: 'time_expired',
      });
      return next(ApiError.attemptLocked('Contest time has expired. Your test has been submitted automatically.'));
    }

    req.attempt = attempt;
    req.contest = contest;
    req.remainingSeconds = timing.remainingSeconds;
    next();
  } catch (err) {
    next(err);
  }
};
