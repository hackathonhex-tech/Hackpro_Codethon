import { attemptRepository } from '../attempts/attempts.repository.js';
import { contestRepository } from '../contests/contests.repository.js';
import { participantRepository } from '../participants/participants.repository.js';
import { teamRepository } from '../teams/teams.repository.js';
import { attemptsService } from '../attempts/attempts.service.js';
import { calculateAttemptTiming } from '../../utils/time.js';
import { LEADERBOARD_DISPLAY_MODE } from '@codeathon/shared';
import { ApiError } from '../../utils/ApiError.js';

export class LeaderboardService {
  async getLeaderboard(contestId, isStudent = false) {
    const contest = await contestRepository.findById(contestId);
    if (!contest) throw ApiError.notFound('Contest not found');

    const config = contest.leaderboardConfig || { enabled: true, displayMode: LEADERBOARD_DISPLAY_MODE.WITH_NAMES, topN: 50 };

    if (!config.enabled && isStudent) {
      return {
        enabled: false,
        message: 'Leaderboard is currently disabled for this contest.',
        entries: [],
      };
    }

    // Check freeze mode
    const now = Date.now();
    const endWindow = new Date(contest.endTime).getTime();
    const freezeMs = (config.freezeMinutesBeforeEnd || 0) * 60 * 1000;
    const isFrozen = freezeMs > 0 && now >= endWindow - freezeMs && now <= endWindow;

    let attempts = await attemptRepository.find({ contestId });

    // Auto-finalize and grade any in-progress attempt whose exam window / duration has expired
    const isManual = contest.activationMode === 'manual';
    let hadExpired = false;
    for (const att of attempts) {
      if (att.status === 'in_progress') {
        const timing = calculateAttemptTiming(
          att.startedAt,
          contest.durationMinutes,
          contest.endTime,
          contest.gracePeriodMinutes || 0,
          att.extensionSeconds || 0,
          isManual
        );
        if (timing.isExpired) {
          try {
            await attemptsService.finishAttempt(contestId, { userId: att.userId }, 'time_expired');
            hadExpired = true;
          } catch (_) {}
        }
      }
    }
    if (hadExpired) {
      attempts = await attemptRepository.find({ contestId });
    }

    const allParticipants = await participantRepository.find({});
    const allTeams = await teamRepository.find({});

    // Filter to submitted or in-progress attempts with a score or submission
    const scoredAttempts = attempts.filter((a) =>
      (a.finalScore !== undefined && a.finalScore !== null) ||
      (a.score !== undefined && a.score !== null) ||
      (a.totalScore !== undefined && a.totalScore !== null) ||
      a.status === 'submitted'
    );

    // Sort by:
    // 1. Highest Total Score descending
    // 2. Fastest Submission / Shortest completion time ascending (Tie-Breaker)
    // 3. Earlier submitted timestamp ascending (Secondary Tie-Breaker)
    scoredAttempts.sort((a, b) => {
      const scoreA = Number(a.totalScore ?? a.finalScore ?? a.score ?? 0);
      const scoreB = Number(b.totalScore ?? b.finalScore ?? b.score ?? 0);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      // Fastest Submission tie-breaker: shortest completion time in seconds
      const timeA = Number(a.completionTimeSeconds) > 0 ? Number(a.completionTimeSeconds) : 999999;
      const timeB = Number(b.completionTimeSeconds) > 0 ? Number(b.completionTimeSeconds) : 999999;
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 9999999999999;
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 9999999999999;
      return dateA - dateB;
    });

    const topLimit = config.topN || 50;
    const sliced = scoredAttempts.slice(0, topLimit);

    const formatDuration = (secs) => {
      if (!secs || secs <= 0) return '—';
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      if (h > 0) {
        return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
      }
      return `${m}m ${s.toString().padStart(2, '0')}s`;
    };

    const entries = sliced.map((att, index) => {
      const participant = allParticipants.find((p) =>
        String(p.id) === String(att.userId) ||
        String(p._id) === String(att.userId) ||
        p.email === att.userId
      );
      const team = participant?.teamId ? allTeams.find((t) => String(t.id) === String(participant.teamId) || String(t._id) === String(participant.teamId)) : null;

      const isAnonymous = isStudent && config.displayMode === LEADERBOARD_DISPLAY_MODE.ANONYMOUS;
      const candidateName = participant?.name || participant?.fullName || att.userName || 'Candidate';
      const rollNumber = participant?.rollNumber || att.rollNumber || '—';
      const score = att.totalScore ?? att.finalScore ?? att.score ?? 0;
      const timeSecs = att.completionTimeSeconds || 0;

      return {
        rank: index + 1,
        userId: isAnonymous ? `student_${index + 1}` : att.userId,
        participantId: isAnonymous ? `student_${index + 1}` : (att.userId || `part_${index + 1}`),
        name: isAnonymous ? `Participant #${index + 1}` : candidateName,
        displayName: isAnonymous ? `Participant #${index + 1}` : candidateName,
        rollNumber: isAnonymous ? undefined : rollNumber,
        teamName: isAnonymous ? undefined : team?.name,
        score,
        totalScore: score,
        mcqScore: att.mcqScore || 0,
        codingScore: att.codingScore || 0,
        completionTimeSeconds: timeSecs,
        timeTakenMinutes: Math.round(timeSecs / 60),
        formattedTimeTaken: formatDuration(timeSecs),
        status: att.status,
        submittedAt: att.submittedAt,
      };
    });

    return {
      enabled: true,
      isFrozen,
      displayMode: config.displayMode,
      totalContestants: scoredAttempts.length,
      entries,
    };
  }
}

export const leaderboardService = new LeaderboardService();
