import { reportsService } from './reports.service.js';
import { successResponse } from '../../utils/response.js';

export class ReportsController {
  async getReport(req, res) {
    const report = await reportsService.getReport(req.params.contestId);
    return successResponse(res, report);
  }

  async updateOverrides(req, res) {
    const result = await reportsService.updateReportOverrides(req.params.contestId, req.user, req.body);
    return successResponse(res, result);
  }

  async resetOverrides(req, res) {
    const result = await reportsService.resetOverrides(req.params.contestId, req.user);
    return successResponse(res, result);
  }

  async exportReport(req, res) {
    const csvData = await reportsService.exportReport(req.params.contestId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="report_${req.params.contestId}.csv"`);
    return res.send(csvData);
  }
}

export const reportsController = new ReportsController();
