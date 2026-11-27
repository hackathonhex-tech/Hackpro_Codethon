import { participantsService } from './participants.service.js';
import { successResponse } from '../../utils/response.js';
import { getPagination } from '../../utils/pagination.js';
import { toCsv } from '../../utils/csv.js';

export class ParticipantsController {
  async getAll(req, res) {
    const { page, limit, skip } = getPagination(req.query);
    const all = await participantsService.getAllParticipants({
      search: req.query.search,
      teamId: req.query.teamId,
    });
    const items = all.slice(skip, skip + limit);
    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total: all.length,
        totalPages: Math.ceil(all.length / limit) || 1,
      },
    });
  }

  async getById(req, res) {
    const item = await participantsService.getParticipantById(req.params.id);
    return successResponse(res, item);
  }

  async create(req, res) {
    const item = await participantsService.createParticipant(req.body);
    return successResponse(res, item, 201);
  }

  async bulkImport(req, res) {
    const csvContent = req.body.csv || req.body;
    const result = await participantsService.bulkImportCsv(
      typeof csvContent === 'string' ? csvContent : JSON.stringify(csvContent)
    );
    return successResponse(res, result);
  }

  async exportCsv(req, res) {
    const all = await participantsService.getAllParticipants();
    const formatted = all.map((p, idx) => ({
      'S.No': idx + 1,
      'Superset ID': p.rollNumber || '—',
      'Candidate Name': p.name || 'Candidate',
      'Email Address': p.email || '—',
      'Team Association': p.teamName || 'Individual',
    }));
    const csvData = toCsv(formatted);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="participants.csv"');
    return res.send(csvData);
  }

  async update(req, res) {
    const item = await participantsService.updateParticipant(req.params.id, req.body);
    return successResponse(res, item);
  }

  async delete(req, res) {
    await participantsService.deleteParticipant(req.params.id);
    return successResponse(res, { message: 'Participant deleted successfully' });
  }

  async deleteAll(req, res) {
    const result = await participantsService.deleteAllParticipants();
    return successResponse(res, result);
  }
}

export const participantsController = new ParticipantsController();
