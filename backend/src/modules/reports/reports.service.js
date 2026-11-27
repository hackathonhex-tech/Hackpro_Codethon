import { reportOverrideRepository } from './reportOverride.repository.js';
import { analyticsService } from '../analytics/analytics.service.js';
import { auditRepository } from '../audit/audit.repository.js';
import { toCsv } from '../../utils/csv.js';

export class ReportsService {
  async getReport(contestId) {
    const realAnalytics = await analyticsService.getDashboardAnalytics(contestId);
    const overrides = await reportOverrideRepository.findByContest(contestId);

    const hasOverrides = !!overrides && Object.keys(overrides.overrides || {}).length > 0;

    const mergedStats = {
      ...realAnalytics.stats,
      ...(overrides ? overrides.overrides : {}),
    };

    return {
      contestId,
      contestTitle: realAnalytics.contestTitle,
      realStats: realAnalytics.stats,
      displayStats: mergedStats,
      hasOverrides,
      overrides: overrides?.overrides || {},
      note: overrides?.note || '',
      lastModified: overrides?.updatedAt || null,
      footerLabel: hasOverrides ? 'Adjusted / Estimated figures' : 'Official Verified Figures',
    };
  }

  async updateReportOverrides(contestId, user, { overrides, note }) {
    const existing = await reportOverrideRepository.findByContest(contestId);
    const oldValues = existing?.overrides || {};

    let record;
    if (existing) {
      record = await reportOverrideRepository.update(existing.id, {
        overrides,
        note: note || 'Presentation figure adjustment',
      });
    } else {
      record = await reportOverrideRepository.create({
        contestId,
        overrides,
        note: note || 'Presentation figure adjustment',
      });
    }

    // Write to audit log
    await auditRepository.create({
      userId: user.userId,
      userName: user.name,
      action: 'REPORT_MOCK_OVERRIDE_UPDATED',
      details: {
        contestId,
        oldValues,
        newValues: overrides,
        note,
      },
      createdAt: new Date().toISOString(),
    });

    return record;
  }

  async resetOverrides(contestId, user) {
    const existing = await reportOverrideRepository.findByContest(contestId);
    if (existing) {
      await reportOverrideRepository.resetOverrides(contestId);
      await auditRepository.create({
        userId: user.userId,
        userName: user.name,
        action: 'REPORT_OVERRIDE_RESET_TO_ACTUAL',
        details: { contestId, previousOverrides: existing.overrides },
        createdAt: new Date().toISOString(),
      });
    }
    return { message: 'Report reset to real actual figures successfully' };
  }

  async exportReport(contestId) {
    const report = await this.getReport(contestId);
    const rows = [
      {
        Metric: 'Total Registered',
        Value: report.displayStats.totalRegistered,
      },
      {
        Metric: 'Total Started',
        Value: report.displayStats.started,
      },
      {
        Metric: 'Total Submitted',
        Value: report.displayStats.submitted,
      },
      {
        Metric: 'Average Score',
        Value: report.displayStats.averageScore,
      },
      {
        Metric: 'Highest Score',
        Value: report.displayStats.highestScore,
      },
      {
        Metric: 'Average Time (Mins)',
        Value: report.displayStats.averageTimeMinutes,
      },
      {
        Metric: 'Report Classification',
        Value: report.footerLabel,
      },
    ];

    let csv = toCsv(rows);
    if (report.hasOverrides) {
      csv += '\n\n# NOTE: Adjusted / Estimated figures for presentation purposes.';
    }
    return csv;
  }
}

export const reportsService = new ReportsService();
