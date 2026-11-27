import { contestRepository } from '../contests/contests.repository.js';
import { attemptRepository } from '../attempts/attempts.repository.js';
import { assignmentRepository } from '../assignments/assignments.repository.js';
import { questionRepository } from '../questions/questions.repository.js';
import { submissionRepository } from '../submissions/submissions.repository.js';
import { proctorEventRepository } from '../proctoring/proctoring.repository.js';
import { participantRepository } from '../participants/participants.repository.js';
import { teamRepository } from '../teams/teams.repository.js';
import { toCsv } from '../../utils/csv.js';

export class AnalyticsService {
  async getDashboardAnalytics(contestId) {
    const contests = contestId ? [await contestRepository.findById(contestId)] : await contestRepository.find({});
    const activeContest = contests[0];

    const attempts = contestId
      ? await attemptRepository.find({ contestId })
      : await attemptRepository.find({});

    const assignments = contestId
      ? await assignmentRepository.findByContest(contestId)
      : await assignmentRepository.find({});

    const allParticipants = await participantRepository.find({});
    const participantIdSet = new Set(allParticipants.map((p) => p.id));
    const allTeams = await teamRepository.find({});
    const teamIdSet = new Set(allTeams.map((t) => t.id));

    // Only count assignments belonging to currently available, active candidates or teams
    const validAssignments = assignments.filter((a) => {
      if (a.participantId) return participantIdSet.has(a.participantId);
      if (a.teamId) return teamIdSet.has(a.teamId);
      return false;
    });

    const totalRegistered = validAssignments.length;
    const started = attempts.length;
    const currentlyAttempting = attempts.filter((a) => a.status === 'in_progress').length;
    const submitted = attempts.filter((a) => a.status === 'submitted').length;

    // Scores
    const scores = attempts.filter((a) => a.finalScore !== undefined).map((a) => a.finalScore);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const highestScore = scores.length ? Math.max(...scores) : 0;

    // Score distribution brackets [0-20, 21-40, 41-60, 61-80, 81-100]
    const scoreDistribution = {
      '0-20': scores.filter((s) => s <= 20).length,
      '21-40': scores.filter((s) => s > 20 && s <= 40).length,
      '41-60': scores.filter((s) => s > 40 && s <= 60).length,
      '61-80': scores.filter((s) => s > 60 && s <= 80).length,
      '81-100': scores.filter((s) => s > 80).length,
    };

    // Average time in minutes
    const times = attempts.filter((a) => a.completionTimeSeconds).map((a) => Math.round(a.completionTimeSeconds / 60));
    const avgTimeMinutes = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

    // Language usage
    const submissions = contestId
      ? await submissionRepository.find({ contestId })
      : await submissionRepository.find({});

    const languageUsage = {};
    submissions.forEach((s) => {
      const lang = s.language || 'unknown';
      languageUsage[lang] = (languageUsage[lang] || 0) + 1;
    });

    // Violations summary
    const violations = contestId
      ? await proctorEventRepository.find({ contestId })
      : await proctorEventRepository.find({});

    const violationSummary = {
      total: violations.length,
      byType: {},
    };
    violations.forEach((v) => {
      violationSummary.byType[v.type] = (violationSummary.byType[v.type] || 0) + 1;
    });

    // Top performers
    const sortedAttempts = [...attempts]
      .filter((a) => a.finalScore !== undefined)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 10);

    const topPerformers = sortedAttempts.map((a, idx) => ({
      rank: idx + 1,
      userId: a.userId,
      name: a.userName,
      rollNumber: a.userRoll,
      score: a.finalScore,
      timeTakenMinutes: Math.round((a.completionTimeSeconds || 0) / 60),
    }));

    return {
      contestId: activeContest?.id || null,
      contestTitle: activeContest?.title || 'All Contests',
      stats: {
        totalRegistered,
        started,
        currentlyAttempting,
        submitted,
        averageScore: avgScore,
        highestScore,
        averageTimeMinutes: avgTimeMinutes,
      },
      scoreDistribution,
      languageUsage,
      violationSummary,
      topPerformers,
    };
  }

  async exportCsv(contestId) {
    const data = await this.getDashboardAnalytics(contestId);
    const summaryRow = [
      {
        Contest: data.contestTitle,
        Registered: data.stats.totalRegistered,
        Started: data.stats.started,
        CurrentlyAttempting: data.stats.currentlyAttempting,
        Submitted: data.stats.submitted,
        AverageScore: data.stats.averageScore,
        HighestScore: data.stats.highestScore,
        AverageTimeMinutes: data.stats.averageTimeMinutes,
      },
    ];
    return toCsv(summaryRow);
  }
}

export const analyticsService = new AnalyticsService();
