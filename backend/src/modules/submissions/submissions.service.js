import { attemptRepository } from '../attempts/attempts.repository.js';
import { answerRepository } from '../attempts/answers.repository.js';
import { submissionRepository } from './submissions.repository.js';
import { attendanceRepository } from '../attendance/attendance.repository.js';
import { participantRepository } from '../participants/participants.repository.js';
import { contestRepository } from '../contests/contests.repository.js';
import { auditRepository } from '../audit/audit.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { ATTEMPT_STATUS } from '@codeathon/shared';
import { getSocketServer } from '../../sockets/index.js';

export class SubmissionsService {
  async getLockedSubmissions(contestId = null, query = {}) {
    const allAttempts = await attemptRepository.find(contestId ? { contestId } : {});
    // Only return currently submitted/locked attempts. Revoked or in-progress attempts are unlocked and must not appear in the locked list.
    const list = allAttempts.filter(
      (a) => a.status === ATTEMPT_STATUS.SUBMITTED
    );
    const allParticipants = await participantRepository.find({});
    const allContests = await contestRepository.find({});

    let enriched = list.map((a) => {
      const participant = allParticipants.find((p) =>
        String(p.id) === String(a.userId) ||
        String(p._id) === String(a.userId) ||
        p.email === a.userId
      );
      const contest = allContests.find((c) =>
        String(c.id) === String(a.contestId) ||
        String(c._id) === String(a.contestId)
      );
      return {
        _id: a.id || a._id,
        id: a.id || a._id,
        attemptId: a.id || a._id,
        userId: a.userId,
        rollNumber: participant?.rollNumber || a.rollNumber || a.userRoll || '—',
        participantName: participant?.name || participant?.fullName || a.userName || 'Candidate',
        contestTitle: contest?.title || a.contestTitle || 'Assessment Challenge',
        contestId: a.contestId,
        status: a.status,
        totalScore: a.finalScore ?? a.totalScore ?? 0,
        finalScore: a.finalScore ?? a.totalScore ?? 0,
        mcqScore: a.mcqScore ?? 0,
        codingScore: a.codingScore ?? 0,
        submittedAt: a.submittedAt || a.updatedAt || a.startedAt,
      };
    });

    if (query.search) {
      const q = query.search.toLowerCase().trim();
      enriched = enriched.filter(
        (s) =>
          (s.participantName && s.participantName.toLowerCase().includes(q)) ||
          (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
          (s.contestTitle && s.contestTitle.toLowerCase().includes(q))
      );
    }

    enriched.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
    const skip = (page - 1) * limit;
    const total = enriched.length;
    const paginated = enriched.slice(skip, skip + limit);

    return {
      data: paginated,
      items: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async revokeSubmission(user, { attemptId, reason, extensionMinutes = 0, resetAnswers = true }) {
    const attempt = await attemptRepository.findById(attemptId);
    if (!attempt) throw ApiError.notFound('Attempt not found');

    const contest = await contestRepository.findById(attempt.contestId);
    const durationMinutes = contest?.durationMinutes || 60;
    const effectiveMinutes = Number(extensionMinutes) > 0 ? Number(extensionMinutes) : durationMinutes;
    const now = new Date();
    const newStartedAt = now.toISOString();
    const newEndsAt = new Date(now.getTime() + effectiveMinutes * 60 * 1000).toISOString();

    // 1. Reset attempt status, timers, scores, and cooldowns
    const updated = await attemptRepository.update(attemptId, {
      status: ATTEMPT_STATUS.IN_PROGRESS,
      startedAt: newStartedAt,
      endsAt: newEndsAt,
      extensionSeconds: effectiveMinutes * 60,
      submittedAt: null,
      submissionReason: null,
      finalScore: null,
      totalScore: null,
      mcqScore: 0,
      codingScore: 0,
      completionTimeSeconds: null,
      formattedTimeTaken: null,
      scoreBreakdown: null,
      metrics: {},
      lastRunTimestamps: {},
      revokedBy: user.userId,
      revokedByName: user.name,
      revocationReason: reason,
      revokedAt: newStartedAt,
    });

    // 2. Clear previous code submissions so question submission quota is completely restored (e.g. 0/3 used, 3/3 left)
    await submissionRepository.deleteMany({ attemptId });

    // 3. Clear previous answers so questions do not show as already answered / attempted green
    if (resetAnswers !== false) {
      await answerRepository.deleteMany({ attemptId });
    }

    // 4. Reset attendance record back to present
    const attendance = await attendanceRepository.findByContestAndUser(attempt.contestId, attempt.userId);
    if (attendance) {
      await attendanceRepository.update(attendance.id, {
        status: 'present',
        submitTimestamp: null,
        durationMinutes: 0,
      });
    }

    // Write to audit log
    await auditRepository.create({
      userId: user.userId,
      userName: user.name,
      action: 'SUBMISSION_REVOKED',
      details: {
        attemptId,
        studentId: attempt.userId,
        studentName: attempt.userName,
        contestId: attempt.contestId,
        reason,
        extensionMinutes: effectiveMinutes,
        resetAnswers: resetAnswers !== false,
      },
      createdAt: new Date().toISOString(),
    });

    // Emit Socket.IO event to student's room & contest rooms
    const io = getSocketServer();
    if (io) {
      io.to(`attempt:${attemptId}`).emit('attempt:revoked', {
        attemptId,
        contestId: attempt.contestId,
        userId: attempt.userId,
        reason,
        extensionMinutes: effectiveMinutes,
      });
      io.to(`contest:${attempt.contestId}`).emit('attempt:revoked', {
        attemptId,
        contestId: attempt.contestId,
        userId: attempt.userId,
        reason,
      });
      io.to(`admin:contest:${attempt.contestId}`).emit('attempt:revoked', {
        attemptId,
        studentName: attempt.userName,
        reason,
      });
    }

    return updated;
  }
}

export const submissionsService = new SubmissionsService();
