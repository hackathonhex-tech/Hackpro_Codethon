import { attendanceService } from './attendance.service.js';
import { successResponse } from '../../utils/response.js';

export class AttendanceController {
  async getByContest(req, res) {
    const data = await attendanceService.getAttendanceByContest(req.params.contestId, req.query);
    return successResponse(res, data);
  }

  async exportCsv(req, res) {
    const csvData = await attendanceService.exportCsv(req.params.contestId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${req.params.contestId}.csv"`);
    return res.send(csvData);
  }

  async markAttendance(req, res) {
    const { userId, status } = req.body;
    const result = await attendanceService.markAttendance(req.params.contestId, userId, status);
    return successResponse(res, result);
  }
}

export const attendanceController = new AttendanceController();
