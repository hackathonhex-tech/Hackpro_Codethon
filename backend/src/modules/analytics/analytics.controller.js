import { analyticsService } from './analytics.service.js';
import { successResponse } from '../../utils/response.js';

export class AnalyticsController {
  async getDashboard(req, res) {
    const data = await analyticsService.getDashboardAnalytics(req.query.contestId);
    return successResponse(res, data);
  }

  async exportCsv(req, res) {
    const csvData = await analyticsService.exportCsv(req.query.contestId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics_summary.csv"');
    return res.send(csvData);
  }
}

export const analyticsController = new AnalyticsController();
