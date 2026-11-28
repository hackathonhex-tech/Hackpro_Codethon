import { attemptRepository } from './attempts.repository.js';
import { answerRepository } from './answers.repository.js';
import { contestRepository } from '../contests/contests.repository.js';
import { assignmentRepository } from '../assignments/assignments.repository.js';
import { questionRepository } from '../questions/questions.repository.js';
import { sectionRepository } from '../sections/sections.repository.js';
import { submissionRepository } from '../submissions/submissions.repository.js';
import { attendanceRepository } from '../attendance/attendance.repository.js';
import { rubricRepository } from '../rubrics/rubrics.repository.js';
import { participantRepository } from '../participants/participants.repository.js';
import { RubricEngine } from '../rubrics/rubricEngine.js';
import { executionService } from '../execution/executionService.js';
import { calculateAttemptTiming } from '../../utils/time.js';
import { ApiError } from '../../utils/ApiError.js';
import { ATTEMPT_STATUS, CONTEST_STATUS, SUBMISSION_VERDICT } from '@codeathon/shared';
import { getSocketServer } from '../../sockets/index.js';

function formatDuration(secs) {
  if (secs == null || isNaN(secs) || secs < 0) return '—';
  const s = Math.max(0, Math.floor(secs));
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const remainingSecs = s % 60;
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m ${remainingSecs.toString().padStart(2, '0')}s`;
  }
  return `${m}m ${remainingSecs.toString().padStart(2, '0')}s`;
}

export class AttemptsService {
  async joinByBatchCode(batchCode, user) {
    if (!batchCode || !batchCode.trim()) {
      throw ApiError.badRequest('Batch code is required');
    }
    const clean = batchCode.trim().toLowerCase();
    const allContests = await contestRepository.find({});
    const matched = allContests.find(
      (c) => c.batchCode && c.batchCode.trim().toLowerCase() === clean
    );
    if (!matched) {
      throw ApiError.notFound('Invalid Batch Code. No assessment found for this batch.');
    }
    const isAssigned = await assignmentRepository.isAssigned(matched.id, user.userId);
    if (!isAssigned) {
      await assignmentRepository.create({
        contestId: matched.id,
        participantId: user.userId,
        assignedAt: new Date().toISOString(),
      });
    }
    return {
      message: `Successfully joined batch assessment for ${matched.title}`,
      contestId: matched.id,
      title: matched.title,
    };
  }

  async getAssignedContests(user) {
    const participant = await participantRepository.findById(user.userId);
    const teamId = participant?.teamId || null;

    const allContests = await contestRepository.find({});
    const assignedContests = [];

    for (const contest of allContests) {
      const isAssigned = await assignmentRepository.isAssigned(contest.id, user.userId, teamId);
      const isBatchMatch = Boolean(
        user.batchCode &&
        contest.batchCode &&
        contest.batchCode.trim().toLowerCase() === String(user.batchCode).trim().toLowerCase()
      );
      if (isAssigned || isBatchMatch || user.isSuperAdmin) {
        const attempt = await attemptRepository.findByContestAndUser(contest.id, user.userId);
        
        let attemptStatus = ATTEMPT_STATUS.NOT_STARTED;
        let remainingSeconds = contest.durationMinutes * 60;
        let score = null;

        if (attempt) {
          attemptStatus = attempt.status;
          score = attempt.finalScore;
          if (attempt.status === ATTEMPT_STATUS.IN_PROGRESS) {
            const timing = calculateAttemptTiming(
              attempt.startedAt,
              contest.durationMinutes,
              contest.endTime,
              contest.gracePeriodMinutes || 0,
              attempt.extensionSeconds || 0
            );
            remainingSeconds = timing.remainingSeconds;
          }
        }

        // Compute live/scheduled/ended dynamically adhering strictly to activationMode & isTurnedOff
        const now = Date.now();
        const isManual = contest.activationMode === 'manual';
        let computedStatus = contest.status;

        if (contest.isTurnedOff) {
          computedStatus = CONTEST_STATUS.ENDED;
        } else if (isManual) {
          computedStatus = (contest.status === CONTEST_STATUS.LIVE || contest.status === 'live')
            ? CONTEST_STATUS.LIVE
            : CONTEST_STATUS.DRAFT;
        } else if (contest.status !== CONTEST_STATUS.DRAFT && contest.status !== CONTEST_STATUS.ARCHIVED) {
          const start = contest.startTime ? new Date(contest.startTime).getTime() : 0;
          const end = contest.endTime ? new Date(contest.endTime).getTime() + (contest.gracePeriodMinutes || 0) * 60 * 1000 : 0;
          if (start && now < start) computedStatus = CONTEST_STATUS.SCHEDULED;
          else if (start && end && now >= start && now <= end) computedStatus = CONTEST_STATUS.LIVE;
          else if (end && now > end) computedStatus = CONTEST_STATUS.ENDED;
          else computedStatus = contest.status || CONTEST_STATUS.DRAFT;
        }

        const canShowScore =
          contest.showTotalPointsEarned !== false &&
          contest.resultVisibility !== 'hidden';

        assignedContests.push({
          id: contest.id,
          _id: contest.id,
          title: contest.title,
          batchCode: contest.batchCode,
          description: contest.description,
          instructions: contest.instructions,
          startTime: contest.startTime,
          endTime: contest.endTime,
          durationMinutes: contest.durationMinutes,
          gracePeriodMinutes: contest.gracePeriodMinutes || 0,
          status: computedStatus,
          computedStatus,
          activationMode: contest.activationMode || 'scheduled',
          isTurnedOff: Boolean(contest.isTurnedOff),
          showTotalPointsEarned: contest.showTotalPointsEarned !== false,
          resultVisibility: contest.resultVisibility || 'immediate',
          proctorConfig: contest.proctorConfig || {},
          leaderboardConfig: contest.leaderboardConfig || {},
          attempt: attempt
            ? {
                id: attempt.id,
                status: attemptStatus,
                startedAt: attempt.startedAt,
                endsAt: attempt.endsAt,
                remainingSeconds,
                finalScore: canShowScore ? score : null,
                completionTimeSeconds: attempt.completionTimeSeconds,
                formattedTimeTaken: formatDuration(attempt.completionTimeSeconds),
              }
            : null,
        });
      }
    }

    if (user.batchCode) {
      const clean = String(user.batchCode).trim().toLowerCase();
      return assignedContests.filter((c) => c.batchCode && c.batchCode.trim().toLowerCase() === clean);
    }

    return assignedContests;
  }

  async getContestOverview(contestId, user) {
    const contest = await contestRepository.findById(contestId);
    if (!contest) throw ApiError.notFound('Contest not found');

    const participant = await participantRepository.findById(user.userId);
    const teamId = participant?.teamId || null;

    const isAssigned = await assignmentRepository.isAssigned(contest.id, user.userId, teamId);
    if (!isAssigned && !user.isSuperAdmin && user.role !== 'admin') {
      // Auto-assign candidate so they can take contest smoothly
      await assignmentRepository.create({
        contestId: contest.id,
        participantId: user.userId,
        teamId: null,
        assignedAt: new Date().toISOString(),
      });
    }

    let questions = await questionRepository.findByContest(contestId);
    if (contest.enableMcq === false) {
      questions = questions.filter((q) => q.type !== 'mcq');
    }

    const attempt = await attemptRepository.findByContestAndUser(contestId, user.userId);

    let totalMarks = 0;
    if (attempt?.assignedQuestionIds && attempt.assignedQuestionIds.length > 0) {
      const assignedSet = new Set(attempt.assignedQuestionIds.map(String));
      const myQuestions = questions.filter((q) => assignedSet.has(String(q.id)) || assignedSet.has(String(q._id)));
      totalMarks = myQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
    } else {
      const codingQ = questions.filter((q) => q.type === 'coding');
      const mcqQ = contest.enableMcq === false ? [] : questions.filter((q) => q.type === 'mcq');
      const limitCoding = Math.min(contest.questionsPerParticipant || 2, codingQ.length);
      const codingMarks = codingQ.slice(0, limitCoding).reduce((sum, q) => sum + (q.marks || 50), 0);
      const mcqMarks = mcqQ.reduce((sum, q) => sum + (q.marks || 10), 0);
      totalMarks = codingMarks + mcqMarks;
    }

    const canShowScore =
      contest.showTotalPointsEarned !== false &&
      contest.resultVisibility !== 'hidden';

    // Dynamic resolution of status matching activation mode
    const now = Date.now();
    const isManual = contest.activationMode === 'manual';
    let resolvedStatus = contest.status;

    if (contest.isTurnedOff) {
      resolvedStatus = CONTEST_STATUS.ENDED;
    } else if (isManual) {
      resolvedStatus = (contest.status === CONTEST_STATUS.LIVE || contest.status === 'live')
        ? CONTEST_STATUS.LIVE
        : CONTEST_STATUS.DRAFT;
    } else if (contest.status !== CONTEST_STATUS.DRAFT && contest.status !== CONTEST_STATUS.ARCHIVED) {
      const start = contest.startTime ? new Date(contest.startTime).getTime() : 0;
      const end = contest.endTime ? new Date(contest.endTime).getTime() + (contest.gracePeriodMinutes || 0) * 60 * 1000 : 0;
      if (start && now < start) resolvedStatus = CONTEST_STATUS.SCHEDULED;
      else if (start && end && now >= start && now <= end) resolvedStatus = CONTEST_STATUS.LIVE;
      else if (end && now > end) resolvedStatus = CONTEST_STATUS.ENDED;
      else resolvedStatus = contest.status || CONTEST_STATUS.DRAFT;
    }

    return {
      id: contest.id,
      title: contest.title,
      description: contest.description,
      instructions: contest.instructions,
      startTime: contest.startTime,
      endTime: contest.endTime,
      durationMinutes: contest.durationMinutes,
      gracePeriodMinutes: contest.gracePeriodMinutes || 0,
      totalMarks,
      questionCount: questions.length,
      status: resolvedStatus,
      computedStatus: resolvedStatus,
      activationMode: contest.activationMode || 'scheduled',
      isTurnedOff: Boolean(contest.isTurnedOff),
      showTotalPointsEarned: contest.showTotalPointsEarned !== false,
      resultVisibility: contest.resultVisibility || 'immediate',
      proctorConfig: contest.proctorConfig || {},
      leaderboardConfig: contest.leaderboardConfig || {},
      attempt: attempt
        ? {
            id: attempt.id,
            userId: attempt.userId,
            status: attempt.status,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt || attempt.updatedAt || null,
            endsAt: attempt.endsAt,
            remainingSeconds: attempt.remainingSeconds,
            completionTimeSeconds: attempt.completionTimeSeconds || 0,
            formattedTimeTaken: formatDuration(attempt.completionTimeSeconds || 0),
            mcqScore: attempt.mcqScore || 0,
            codingScore: attempt.codingScore || 0,
            totalScore: canShowScore ? (attempt.totalScore ?? attempt.finalScore ?? 0) : null,
            finalScore: canShowScore ? (attempt.finalScore ?? attempt.totalScore ?? 0) : null,
          }
        : null,
    };
  }

  async allocateParticipantQuestions(contest, user, preloadedQuestions = null) {
    const contestId = contest.id || contest._id;
    const allQuestions = preloadedQuestions || (await questionRepository.findByContest(contestId));
    const isMcqEnabled = contest.enableMcq === true;

    // Filter available coding challenges
    const codingQuestions = allQuestions.filter(
      (q) => q.type === 'coding' && q.includeInRandomPool !== false
    );
    // Sort deterministically by order, then creation date / id so all candidates see the exact same ordering
    codingQuestions.sort((a, b) => {
      const orderDiff = (a.order ?? 0) - (b.order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return String(a.createdAt || a.id || a._id).localeCompare(String(b.createdAt || b.id || b._id));
    });

    const codingPoolSize = codingQuestions.length;
    const questionsPerParticipant = Math.max(1, contest.questionsPerParticipant || 2);
    const limitCoding = Math.min(questionsPerParticipant, codingPoolSize);

    let selectedCodingIds = [];

    if (codingPoolSize <= limitCoding || codingPoolSize === 0) {
      selectedCodingIds = codingQuestions.map((q) => q.id || q._id);
    } else {
      // Find candidate's deterministic index among contest assignments or attempts
      let candidateIndex = -1;
      try {
        const assignments = await assignmentRepository.findByContest(contestId);
        const sorted = (assignments || []).slice().sort((a, b) =>
          String(a.participantId || a.id).localeCompare(String(b.participantId || b.id))
        );
        candidateIndex = sorted.findIndex((a) => a.participantId === user.userId);
      } catch (e) {
        candidateIndex = -1;
      }

      if (candidateIndex < 0) {
        try {
          const attempts = await attemptRepository.findByContest(contestId);
          const userAttemptIndex = (attempts || []).findIndex((att) => att.userId === user.userId);
          candidateIndex = userAttemptIndex >= 0 ? userAttemptIndex : (attempts?.length || 0);
        } catch (e) {
          candidateIndex = 0;
        }
      }

      // Mathematical Round Robin with dynamic stride offset across epochs
      // Distributes all 600+ candidates with equal frequency across questions
      const i = Math.max(0, candidateIndex);
      const M = codingPoolSize;
      const K = limitCoding;
      const r = Math.floor(i / M);
      const p = i % M;
      const stride = 1 + (r % Math.max(1, M - 1));

      const chosenIndices = new Set();
      for (let step = 0; step < K; step++) {
        let idx = (p + step * stride) % M;
        while (chosenIndices.has(idx) && chosenIndices.size < M) {
          idx = (idx + 1) % M;
        }
        chosenIndices.add(idx);
        selectedCodingIds.push(codingQuestions[idx].id || codingQuestions[idx]._id);
      }
    }

    // MCQ Questions allocation: strictly exclude if MCQ is disabled
    let selectedMcqIds = [];
    if (isMcqEnabled) {
      const mcqQuestions = allQuestions.filter((q) => q.type === 'mcq');
      mcqQuestions.sort((a, b) => {
        const orderDiff = (a.order ?? 0) - (b.order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return String(a.createdAt || a.id || a._id).localeCompare(String(b.createdAt || b.id || b._id));
      });

      const expectedMcq = Number(contest.expectedMcqCount) || 0;
      if (expectedMcq > 0 && expectedMcq < mcqQuestions.length) {
        selectedMcqIds = mcqQuestions.slice(0, expectedMcq).map((q) => q.id || q._id);
      } else {
        selectedMcqIds = mcqQuestions.map((q) => q.id || q._id);
      }
    }

    return [...selectedCodingIds, ...selectedMcqIds];
  }

  async startAttempt(contestId, user) {
    const contest = await contestRepository.findById(contestId);
    if (!contest) throw ApiError.notFound('Contest not found');

    if (contest.isTurnedOff) {
      throw ApiError.badRequest('This assessment has been turned off by the administrator.', 'CONTEST_OFF');
    }

    const now = Date.now();
    const isManual = contest.activationMode === 'manual';
    const isLive = contest.status === 'live' || contest.status === CONTEST_STATUS.LIVE;
    const startWindow = contest.startTime ? new Date(contest.startTime).getTime() : 0;
    const endWindow = contest.endTime
      ? new Date(contest.endTime).getTime() + (contest.gracePeriodMinutes || 0) * 60 * 1000
      : 0;

    if (isManual) {
      if (!isLive && !user.isSuperAdmin) {
        throw ApiError.badRequest('Assessment is currently turned OFF by the administrator.', 'CONTEST_NOT_LIVE');
      }
    } else {
      // Scheduled Mode
      if (contest.status === CONTEST_STATUS.DRAFT && !user.isSuperAdmin) {
        throw ApiError.badRequest('Assessment is currently in draft mode.', 'CONTEST_DRAFT');
      }
      if (startWindow && now < startWindow && !user.isSuperAdmin) {
        throw ApiError.badRequest('Contest has not started yet. Please wait for start time.', 'CONTEST_NOT_STARTED');
      }
      if (endWindow && now > endWindow && !user.isSuperAdmin) {
        throw ApiError.badRequest('Contest window has ended.', 'CONTEST_ENDED');
      }
      if (!startWindow || !endWindow) {
        if (!isLive && !user.isSuperAdmin) {
          throw ApiError.badRequest('Contest timeline is not configured.', 'CONTEST_NOT_CONFIGURED');
        }
      }
    }

    // Auto-assign student if not assigned
    const participant = await participantRepository.findById(user.userId);
    const isAssigned = await assignmentRepository.isAssigned(contest.id, user.userId, participant?.teamId);
    if (!isAssigned) {
      await assignmentRepository.create({
        contestId: contest.id,
        participantId: user.userId,
        teamId: null,
        assignedAt: new Date().toISOString(),
      });
    }

    // Check existing attempt
    let attempt = await attemptRepository.findByContestAndUser(contestId, user.userId);

    if (attempt) {
      if (attempt.status === ATTEMPT_STATUS.SUBMITTED) {
        throw ApiError.attemptLocked();
      }
      return attempt;
    }

    // Server-authoritative start & endsAt calculation
    const startedAt = new Date().toISOString();
    const timing = calculateAttemptTiming(
      startedAt,
      contest.durationMinutes,
      contest.endTime,
      contest.gracePeriodMinutes || 0,
      0,
      isManual
    );

    let assignedQuestionIds = undefined;
    const allQ = await questionRepository.findByContest(contestId);
    const codingCount = allQ.filter((q) => q.type === 'coding').length;
    const questionsPerParticipant = contest.questionsPerParticipant || 2;
    // Always assign questions if pool has more questions than limit, or if round robin / randomize is configured, or MCQ is disabled
    if (
      contest.questionAllocationMethod === 'round_robin' ||
      contest.randomizeQuestions ||
      codingCount > questionsPerParticipant ||
      contest.enableMcq === false
    ) {
      assignedQuestionIds = await this.allocateParticipantQuestions(contest, user, allQ);
    }

    attempt = await attemptRepository.create({
      contestId,
      userId: user.userId,
      userName: user.name,
      userRoll: user.rollNumber,
      status: ATTEMPT_STATUS.IN_PROGRESS,
      startedAt,
      endsAt: timing.endsAt,
      extensionSeconds: 0,
      finalScore: 0,
      activeSessionId: Math.random().toString(36).substring(7),
      assignedQuestionIds,
    });

    // Mark attendance Present automatically
    const existingAttendance = await attendanceRepository.findByContestAndUser(contestId, user.userId);

    if (existingAttendance) {
      await attendanceRepository.update(existingAttendance.id, {
        status: 'present',
        testStartTimestamp: startedAt,
      });
    } else {
      await attendanceRepository.create({
        contestId,
        userId: user.userId,
        userName: user.name,
        rollNumber: user.rollNumber,
        teamId: participant?.teamId || null,
        status: 'present',
        loginStatus: 'Logged in',
        loginTimestamp: startedAt,
        testStartTimestamp: startedAt,
        submitTimestamp: null,
        durationMinutes: 0,
      });
    }

    return attempt;
  }

  async getAttemptState(contestId, user) {
    const contest = await contestRepository.findById(contestId);
    if (!contest) throw ApiError.notFound('Contest not found');

    const attempt = await attemptRepository.findByContestAndUser(contestId, user.userId);
    if (!attempt) {
      throw ApiError.badRequest('Attempt not started. Please call start first.');
    }

    const isManual = contest.activationMode === 'manual';
    if (contest.isTurnedOff && attempt.status === ATTEMPT_STATUS.IN_PROGRESS) {
      await this.finishAttempt(contestId, user, 'contest_turned_off');
      attempt.status = ATTEMPT_STATUS.SUBMITTED;
    }

    const timing = calculateAttemptTiming(
      attempt.startedAt,
      contest.durationMinutes,
      contest.endTime,
      contest.gracePeriodMinutes || 0,
      attempt.extensionSeconds || 0,
      isManual
    );

    if (timing.isExpired && attempt.status === ATTEMPT_STATUS.IN_PROGRESS) {
      await this.finishAttempt(contestId, user, 'time_expired');
      attempt.status = ATTEMPT_STATUS.SUBMITTED;
    }

    // Fetch questions sanitized for student (strictly adhering to assigned questions & MCQ setting)
    let questions = await questionRepository.findByContest(contestId);
    if (contest.enableMcq === false) {
      questions = questions.filter((q) => q.type !== 'mcq');
    }

    const codingCount = questions.filter((q) => q.type === 'coding').length;
    const questionsPerParticipant = contest.questionsPerParticipant || 2;
    const shouldAllocate =
      contest.questionAllocationMethod === 'round_robin' ||
      contest.randomizeQuestions ||
      codingCount > questionsPerParticipant ||
      contest.enableMcq === false;

    if ((!attempt.assignedQuestionIds || !attempt.assignedQuestionIds.length) && shouldAllocate) {
      attempt.assignedQuestionIds = await this.allocateParticipantQuestions(contest, user, questions);
      await attemptRepository.update(attempt.id, { assignedQuestionIds: attempt.assignedQuestionIds });
    }

    if (attempt.assignedQuestionIds && attempt.assignedQuestionIds.length > 0) {
      const assignedSet = new Set(attempt.assignedQuestionIds.map(String));
      questions = questions.filter((q) => assignedSet.has(String(q.id)) || assignedSet.has(String(q._id)));
    }
    const sanitizedQuestions = questions.map((q) => {
      if (q.type === 'mcq') {
        const rawOpts = q.mcqOptions || q.options || [];
        return {
          id: q.id,
          sectionId: q.sectionId,
          type: 'mcq',
          title: q.title,
          statement: q.statement,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          order: q.order,
          isMultiSelect: q.isMultiSelect,
          mcqOptions: rawOpts.map((o, idx) => ({ id: o.id || String(idx), text: o.text || o.title || '' })),
        };
      }
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
    });

    const sections = await sectionRepository.findByContest(contestId);
    const sectionList = sections.length > 0
      ? sections.map((sec) => ({
          _id: sec.id || sec._id,
          id: sec.id || sec._id,
          title: sec.title,
          order: sec.order || 0,
          questions: sanitizedQuestions.filter((q) => q.sectionId === (sec.id || sec._id)),
        }))
      : [
          {
            _id: 'default_section',
            id: 'default_section',
            title: 'General Assessment',
            order: 0,
            questions: sanitizedQuestions,
          },
        ];

    const savedAnswers = await answerRepository.findByAttempt(attempt.id);

    const canShowScore =
      contest.showTotalPointsEarned !== false &&
      contest.resultVisibility !== 'hidden';

    const existingSubmissions = await submissionRepository.findByAttempt(attempt.id);
    const submissionCounts = {};
    (existingSubmissions || []).forEach((s) => {
      if (s.questionId) {
        submissionCounts[s.questionId] = (submissionCounts[s.questionId] || 0) + 1;
      }
    });

    const codeRunCooldownSeconds = contest.codeRunCooldownSeconds ?? 30;
    const maxCodeSubmissions = contest.maxCodeSubmissions ?? 3;

    const maxContestSecs = (Number(contest.durationMinutes) || 30) * 60 + (attempt.extensionSeconds || 0);
    const rawCompletionSecs = attempt.completionTimeSeconds != null
      ? attempt.completionTimeSeconds
      : (attempt.submittedAt && attempt.startedAt
          ? Math.max(0, Math.floor((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000))
          : null);
    const completionSecs = rawCompletionSecs != null && maxContestSecs > 0
      ? Math.min(rawCompletionSecs, maxContestSecs)
      : rawCompletionSecs;
    const formattedTime = formatDuration(completionSecs);

    return {
      contest: {
        id: contest.id,
        title: contest.title,
        description: contest.description,
        instructions: contest.instructions,
        enableMcq: contest.enableMcq !== false,
        durationMinutes: contest.durationMinutes || 30,
        proctorConfig: contest.proctorConfig || {},
        showTotalPointsEarned: contest.showTotalPointsEarned !== false,
        resultVisibility: contest.resultVisibility || 'immediate',
        activationMode: contest.activationMode || 'scheduled',
        isTurnedOff: Boolean(contest.isTurnedOff),
        codeRunCooldownSeconds,
        maxCodeSubmissions,
      },
      attempt: {
        id: attempt.id,
        _id: attempt.id,
        userId: attempt.userId,
        userName: attempt.userName,
        rollNumber: attempt.rollNumber,
        status: attempt.status,
        startedAt: attempt.startedAt,
        endsAt: timing.endsAt,
        remainingSeconds: timing.remainingSeconds,
        finalScore: canShowScore ? attempt.finalScore : null,
        totalScore: canShowScore ? (attempt.finalScore ?? attempt.totalScore ?? 0) : null,
        mcqScore: canShowScore ? (attempt.mcqScore ?? 0) : null,
        codingScore: canShowScore ? (attempt.codingScore ?? 0) : null,
        submittedAt: attempt.submittedAt,
        completionTimeSeconds: completionSecs,
        formattedTimeTaken: formattedTime,
      },
      id: attempt.id,
      _id: attempt.id,
      attemptId: attempt.id,
      userId: attempt.userId,
      userName: attempt.userName,
      rollNumber: attempt.rollNumber,
      showTotalPointsEarned: contest.showTotalPointsEarned !== false,
      resultVisibility: contest.resultVisibility || 'immediate',
      totalScore: canShowScore ? (attempt.finalScore ?? attempt.totalScore ?? 0) : null,
      finalScore: canShowScore ? attempt.finalScore : null,
      mcqScore: canShowScore ? (attempt.mcqScore ?? 0) : null,
      codingScore: canShowScore ? (attempt.codingScore ?? 0) : null,
      submittedAt: attempt.submittedAt,
      startedAt: attempt.startedAt,
      completionTimeSeconds: completionSecs,
      formattedTimeTaken: formattedTime,
      status: attempt.status,
      remainingSeconds: timing.remainingSeconds,
      sections: sectionList,
      questions: sanitizedQuestions,
      savedAnswers,
      submissionCounts,
      codeRunCooldownSeconds,
      maxCodeSubmissions,
      lastRunTimestamps: attempt.lastRunTimestamps || {},
      serverTime: new Date().toISOString(),
    };
  }

  async saveAnswer(contestId, user, { questionId, selectedOptions, isMarkedForReview, draftCode, language }) {
    const contest = await contestRepository.findById(contestId);
    if (contest?.isTurnedOff) {
      throw ApiError.badRequest('This assessment has been turned off by the administrator.', 'CONTEST_OFF');
    }

    const attempt = await attemptRepository.findByContestAndUser(contestId, user.userId);
    if (!attempt) throw ApiError.notFound('Attempt not found');
    if (attempt.status === ATTEMPT_STATUS.SUBMITTED) {
      throw ApiError.attemptLocked();
    }
    if (attempt.assignedQuestionIds && attempt.assignedQuestionIds.length > 0) {
      const isAssigned = attempt.assignedQuestionIds.some((id) => String(id) === String(questionId));
      if (!isAssigned) {
        throw ApiError.badRequest('This challenge is not assigned to your examination session.', 'QUESTION_NOT_ASSIGNED');
      }
    }

    const saved = await answerRepository.upsertAnswer(attempt.id, questionId, {
      selectedOptions: selectedOptions || [],
      isMarkedForReview: !!isMarkedForReview,
      draftCode: draftCode || '',
      language: language || '',
    });

    return { savedAt: saved.updatedAt || saved.createdAt };
  }

  async runCode(contestId, user, { questionId, code, language, customInput }) {
    const contest = await contestRepository.findById(contestId);
    if (!contest) throw ApiError.notFound('Contest not found');
    if (contest.isTurnedOff) {
      throw ApiError.badRequest('This assessment has been turned off by the administrator.', 'CONTEST_OFF');
    }
    const cooldownSeconds = contest.codeRunCooldownSeconds ?? 30;

    const attempt = await attemptRepository.findByContestAndUser(contestId, user.userId);
    if (attempt && attempt.assignedQuestionIds && attempt.assignedQuestionIds.length > 0) {
      const isAssigned = attempt.assignedQuestionIds.some((id) => String(id) === String(questionId));
      if (!isAssigned) {
        throw ApiError.badRequest('This challenge is not assigned to your examination session.', 'QUESTION_NOT_ASSIGNED');
      }
    }
    if (attempt && cooldownSeconds > 0) {
      const lastRunTimestamps = attempt.lastRunTimestamps || {};
      const lastRun = lastRunTimestamps[questionId] || 0;
      const elapsed = Math.floor((Date.now() - lastRun) / 1000);
      if (elapsed < cooldownSeconds) {
        const remaining = cooldownSeconds - elapsed;
        throw ApiError.badRequest(`Code run cooling time active. Please wait ${remaining}s before running again.`);
      }
      lastRunTimestamps[questionId] = Date.now();
      await attemptRepository.update(attempt.id, { lastRunTimestamps });
    }

    const question = await questionRepository.findById(questionId);
    if (!question || question.type !== 'coding') {
      throw ApiError.badRequest('Question not found or not a coding challenge');
    }

    const cfg = question.codingConfig || {};
    const timeLimitMs = cfg.timeLimitMs || 2000;
    const memoryLimitMb = cfg.memoryLimitMb || 256;

    // If custom input provided, run against custom input
    if (customInput !== undefined && customInput !== null && customInput.trim()) {
      const execResult = await executionService.executeCode({
        code,
        language,
        input: customInput,
        timeLimitMs,
        memoryLimitMb,
      });

      return {
        isCustomInput: true,
        input: customInput,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        error: execResult.stderr || (execResult.verdict !== SUBMISSION_VERDICT.PASSED ? execResult.verdict : undefined),
        verdict: execResult.verdict,
        overallVerdict: execResult.verdict,
        timeMs: execResult.timeMs,
        passed: execResult.verdict === SUBMISSION_VERDICT.PASSED,
        cooldownSeconds,
      };
    }

    // Otherwise run against sample test cases
    const sampleCases = (cfg.testCases || []).filter((tc) => tc.isSample);
    const caseResults = [];

    for (let i = 0; i < sampleCases.length; i++) {
      const tc = sampleCases[i];
      const execResult = await executionService.executeCode({
        code,
        language,
        input: tc.input,
        timeLimitMs,
        memoryLimitMb,
      });

      const isMatch = executionService.compareOutput(execResult.stdout, tc.expectedOutput);
      const verdict = execResult.verdict !== SUBMISSION_VERDICT.PASSED ? execResult.verdict : isMatch ? SUBMISSION_VERDICT.PASSED : SUBMISSION_VERDICT.FAILED;

      caseResults.push({
        caseNumber: i + 1,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: execResult.stdout,
        stderr: execResult.stderr,
        verdict,
        timeMs: execResult.timeMs,
        passed: verdict === SUBMISSION_VERDICT.PASSED,
      });
    }

    const allPassed = caseResults.every((c) => c.passed);
    const compileErrCase = caseResults.find((c) => c.verdict === SUBMISSION_VERDICT.COMPILE_ERROR);
    const runtimeErrCase = caseResults.find((c) => c.verdict === SUBMISSION_VERDICT.RUNTIME_ERROR);
    let overallVerdict = allPassed ? SUBMISSION_VERDICT.PASSED : SUBMISSION_VERDICT.FAILED;
    if (compileErrCase) {
      overallVerdict = SUBMISSION_VERDICT.COMPILE_ERROR;
    } else if (runtimeErrCase) {
      overallVerdict = SUBMISSION_VERDICT.RUNTIME_ERROR;
    }

    return {
      isCustomInput: false,
      overallVerdict,
      verdict: overallVerdict,
      error: compileErrCase?.stderr || runtimeErrCase?.stderr || undefined,
      cases: caseResults,
      totalCases: caseResults.length,
      passedCases: caseResults.filter((c) => c.passed).length,
      cooldownSeconds,
    };
  }

  async submitCode(contestId, user, { questionId, code, language }) {
    const contest = await contestRepository.findById(contestId);
    if (!contest) throw ApiError.notFound('Contest not found');
    if (contest.isTurnedOff) {
      throw ApiError.badRequest('This assessment has been turned off by the administrator.', 'CONTEST_OFF');
    }

    const attempt = await attemptRepository.findByContestAndUser(contestId, user.userId);
    if (!attempt) throw ApiError.notFound('Attempt not found');
    if (attempt.status === ATTEMPT_STATUS.SUBMITTED) {
      throw ApiError.attemptLocked();
    }
    if (attempt.assignedQuestionIds && attempt.assignedQuestionIds.length > 0) {
      const isAssigned = attempt.assignedQuestionIds.some((id) => String(id) === String(questionId));
      if (!isAssigned) {
        throw ApiError.badRequest('This challenge is not assigned to your examination session.', 'QUESTION_NOT_ASSIGNED');
      }
    }

    const maxSubmissions = contest?.maxCodeSubmissions ?? 5;
    const existingList = await submissionRepository.findByAttemptAndQuestion(attempt.id, questionId);
    const existingCount = existingList?.length || 0;
    if (existingCount >= maxSubmissions) {
      throw ApiError.badRequest(`Maximum code submissions limit reached (${maxSubmissions}/${maxSubmissions}). You cannot submit more solutions for this challenge.`);
    }

    const question = await questionRepository.findById(questionId);
    if (!question || question.type !== 'coding') {
      throw ApiError.badRequest('Invalid coding question');
    }

    const cfg = question.codingConfig || {};
    const testCases = cfg.testCases || [];
    const timeLimitMs = cfg.timeLimitMs || 2000;
    const memoryLimitMb = cfg.memoryLimitMb || 256;

    const caseResults = [];
    let totalScore = 0;
    let earnedScore = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const weight = Number(tc.weight) || 1;
      totalScore += weight;

      const execResult = await executionService.executeCode({
        code,
        language,
        input: tc.input,
        timeLimitMs,
        memoryLimitMb,
      });

      const isMatch = executionService.compareOutput(execResult.stdout, tc.expectedOutput);
      const verdict = execResult.verdict !== SUBMISSION_VERDICT.PASSED ? execResult.verdict : isMatch ? SUBMISSION_VERDICT.PASSED : SUBMISSION_VERDICT.FAILED;
      const passed = verdict === SUBMISSION_VERDICT.PASSED;

      if (passed) earnedScore += weight;

      caseResults.push({
        id: tc.id,
        isSample: !!tc.isSample,
        isHidden: !!tc.isHidden,
        verdict,
        passed,
        timeMs: execResult.timeMs,
        // Only include actual output/expected output for sample test cases!
        input: tc.isSample ? tc.input : undefined,
        expectedOutput: tc.isSample ? tc.expectedOutput : undefined,
        actualOutput: tc.isSample ? execResult.stdout : undefined,
        stderr: tc.isSample ? execResult.stderr : undefined,
      });
    }

    const passedCases = caseResults.filter((c) => c.passed).length;
    const totalCases = caseResults.length;
    const percentage = totalCases > 0 ? (passedCases / totalCases) * 100 : 0;
    const hasCompileError = caseResults.some((c) => c.verdict === SUBMISSION_VERDICT.COMPILE_ERROR);
    const hasRuntimeError = caseResults.some((c) => c.verdict === SUBMISSION_VERDICT.RUNTIME_ERROR);

    let overallVerdict = passedCases === totalCases ? SUBMISSION_VERDICT.PASSED : SUBMISSION_VERDICT.FAILED;
    if (hasCompileError) {
      overallVerdict = SUBMISSION_VERDICT.COMPILE_ERROR;
    } else if (hasRuntimeError && passedCases === 0) {
      overallVerdict = SUBMISSION_VERDICT.RUNTIME_ERROR;
    }

    const questionMarks = Number(question.marks) || totalScore || 10;
    const scaledEarnedScore = totalScore > 0 ? Math.round((earnedScore / totalScore) * questionMarks) : 0;

    const submission = await submissionRepository.create({
      attemptId: attempt.id,
      contestId,
      userId: user.userId,
      questionId,
      code,
      language,
      verdict: overallVerdict,
      caseResults,
      score: scaledEarnedScore,
      maxScore: questionMarks,
      passedCases,
      totalCases,
      percentage,
      createdAt: new Date().toISOString(),
    });

    // Also autosave current code draft
    await answerRepository.upsertAnswer(attempt.id, questionId, {
      draftCode: code,
      language,
    });

    // Strip hidden case details completely for client response
    const clientSafeCases = caseResults.map((c, idx) => ({
      caseNumber: idx + 1,
      isSample: c.isSample,
      isHidden: c.isHidden,
      verdict: c.verdict,
      passed: c.passed,
      timeMs: c.timeMs,
      input: c.isSample ? c.input : undefined,
      expectedOutput: c.isSample ? c.expectedOutput : undefined,
      actualOutput: c.isSample ? c.actualOutput : undefined,
      stderr: c.isSample ? c.stderr : undefined,
    }));

    // Emit live submission event
    const io = getSocketServer();
    if (io) {
      io.to(`admin:contest:${contestId}`).emit('submission:result', {
        submissionId: submission.id,
        userId: user.userId,
        userName: user.name,
        questionId,
        verdict: overallVerdict,
        passedCases,
        totalCases,
        score: scaledEarnedScore,
        maxScore: questionMarks,
      });
    }

    return {
      submissionId: submission.id,
      verdict: overallVerdict,
      passedCases,
      totalCases,
      earnedScore: scaledEarnedScore,
      maxScore: questionMarks,
      score: scaledEarnedScore,
      cases: clientSafeCases,
      submissionsUsed: existingCount + 1,
      maxSubmissions,
      remainingSubmissions: Math.max(0, maxSubmissions - (existingCount + 1)),
    };
  }

  async finishAttempt(contestId, user, reason = 'user_submit') {
    const attempt = await attemptRepository.findByContestAndUser(contestId, user.userId);
    if (!attempt) throw ApiError.notFound('Attempt not found');
    if (attempt.status === ATTEMPT_STATUS.SUBMITTED) {
      return attempt;
    }

    const contest = await contestRepository.findById(contestId);
    let questions = await questionRepository.findByContest(contestId);
    if (contest?.enableMcq === false) {
      questions = questions.filter((q) => q.type !== 'mcq');
    }
    if (attempt.assignedQuestionIds && attempt.assignedQuestionIds.length > 0) {
      const assignedSet = new Set(attempt.assignedQuestionIds.map(String));
      questions = questions.filter((q) => assignedSet.has(String(q.id)) || assignedSet.has(String(q._id)));
    }
    const answers = await answerRepository.findByAttempt(attempt.id);
    const rubric = contest?.rubricId ? await rubricRepository.findById(contest.rubricId) : null;

    // Grade MCQs
    let totalMcq = 0;
    let correctMcq = 0;
    let mcqScore = 0;
    let mcqMaxScore = 0;

    const mcqQuestions = questions.filter((q) => q.type === 'mcq');
    for (const q of mcqQuestions) {
      const qMarks = Number(q.marks) || 10;
      mcqMaxScore += qMarks;
      totalMcq++;
      const ans = answers.find((a) => a.questionId === q.id);
      const selected = ans?.selectedOptions || [];
      const correctOptionIds = (q.mcqOptions || []).filter((o) => o.isCorrect).map((o) => o.id);

      const isCorrect =
        selected.length > 0 &&
        selected.length === correctOptionIds.length &&
        selected.every((id) => correctOptionIds.includes(id));

      if (isCorrect) {
        correctMcq++;
        mcqScore += qMarks;
      } else if (selected.length > 0 && q.negativeMarks) {
        mcqScore -= Number(q.negativeMarks);
      }
    }
    mcqScore = Math.max(0, mcqScore);

    const mcqAccuracy = totalMcq > 0 ? (correctMcq / totalMcq) * 100 : 100;

    // Grade Coding Submissions based on question-wise allocated marks
    const codingQuestions = questions.filter((q) => q.type === 'coding');
    let totalSampleCases = 0;
    let passedSampleCases = 0;
    let totalHiddenCases = 0;
    let passedHiddenCases = 0;
    let codingScore = 0;
    let codingMaxScore = 0;

    for (const q of codingQuestions) {
      const qMarks = Number(q.marks) || 10;
      codingMaxScore += qMarks;
      const latestSub = await submissionRepository.findLatestByAttemptAndQuestion(attempt.id, q.id);
      if (latestSub && latestSub.caseResults) {
        for (const tc of latestSub.caseResults) {
          if (tc.isSample) {
            totalSampleCases++;
            if (tc.passed) passedSampleCases++;
          }
          if (tc.isHidden) {
            totalHiddenCases++;
            if (tc.passed) passedHiddenCases++;
          }
        }
        // Scaled question score based on percentage of passed test cases
        const pct = latestSub.percentage !== undefined
          ? latestSub.percentage
          : (latestSub.totalCases > 0 ? (latestSub.passedCases / latestSub.totalCases) * 100 : 0);
        const earnedQMarks = Math.round((pct / 100) * qMarks);
        codingScore += earnedQMarks;
      }
    }

    const sampleCasesPassedPct = totalSampleCases > 0 ? (passedSampleCases / totalSampleCases) * 100 : 100;
    const hiddenCasesPassedPct = totalHiddenCases > 0 ? (passedHiddenCases / totalHiddenCases) * 100 : 100;
    const totalCases = totalSampleCases + totalHiddenCases;
    const passedCases = passedSampleCases + passedHiddenCases;
    const testCasesPassedPct = totalCases > 0 ? (passedCases / totalCases) * 100 : 100;

    const now = new Date();
    const startTimeMs = new Date(attempt.startedAt).getTime();
    const durationMinutes = Number(contest?.durationMinutes) > 0 ? Number(contest.durationMinutes) : 30;
    const extensionSeconds = Number(attempt.extensionSeconds) || 0;
    const maxDurationSeconds = durationMinutes * 60 + extensionSeconds;

    // Enforce strict upper bound: time taken can never exceed contest duration
    const rawDiffSecs = Math.max(0, Math.floor((now.getTime() - startTimeMs) / 1000));
    const completionTimeSeconds = Math.min(rawDiffSecs, maxDurationSeconds);
    const submittedAt = new Date(startTimeMs + completionTimeSeconds * 1000).toISOString();

    // Calculate total marks and scores obtained across each question
    const totalMarksPossible = mcqMaxScore + codingMaxScore;
    const totalScoreEarned = mcqScore + codingScore;

    // Optional rubric breakdown calculation
    const rubricResult = RubricEngine.calculateScore(rubric, {
      mcqAccuracy,
      sampleCasesPassedPct,
      hiddenCasesPassedPct,
      testCasesPassedPct,
      totalDurationMinutes: contest?.durationMinutes || 60,
      completionTimeSeconds,
      wrongAttempts: 0,
      avgRuntimeMs: 80,
    });

    const scoreBreakdown = typeof rubricResult === 'object' ? rubricResult.breakdown : null;
    const finalScore = totalScoreEarned;

    const updatedAttempt = await attemptRepository.update(attempt.id, {
      status: ATTEMPT_STATUS.SUBMITTED,
      submittedAt,
      submissionReason: reason,
      finalScore,
      totalScore: totalScoreEarned,
      maxScore: totalMarksPossible,
      mcqScore: Math.max(0, mcqScore),
      codingScore,
      completionTimeSeconds,
      scoreBreakdown,
      metrics: {
        mcqAccuracy,
        sampleCasesPassedPct,
        hiddenCasesPassedPct,
        passedCases,
        totalCases,
        totalMarksPossible,
      },
    });

    // Update Attendance
    const attendance = await attendanceRepository.findByContestAndUser(contestId, user.userId);
    if (attendance) {
      const durationMins = Math.round(completionTimeSeconds / 60);
      await attendanceRepository.update(attendance.id, {
        status: 'completed',
        submitTimestamp: submittedAt,
        durationMinutes: durationMins,
      });
    }

    // Emit live leaderboard update
    const io = getSocketServer();
    if (io) {
      io.to(`contest:${contestId}`).emit('leaderboard:update', {
        contestId,
        userId: user.userId,
        finalScore: totalScoreEarned,
        totalScore: totalScoreEarned,
        completionTimeSeconds,
      });
    }

    return {
      ...updatedAttempt,
      completionTimeSeconds,
      formattedTimeTaken: formatDuration(completionTimeSeconds),
    };
  }
}

export const attemptsService = new AttemptsService();
