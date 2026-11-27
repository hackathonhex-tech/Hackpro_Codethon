import { teamsService } from './teams.service.js';
import { successResponse } from '../../utils/response.js';

export class TeamsController {
  async getAll(req, res) {
    const teams = await teamsService.getAllTeams();
    return successResponse(res, teams);
  }

  async getById(req, res) {
    const team = await teamsService.getTeamById(req.params.id);
    return successResponse(res, team);
  }

  async create(req, res) {
    const team = await teamsService.createTeam(req.body);
    return successResponse(res, team, 201);
  }

  async update(req, res) {
    const team = await teamsService.updateTeam(req.params.id, req.body);
    return successResponse(res, team);
  }

  async delete(req, res) {
    await teamsService.deleteTeam(req.params.id);
    return successResponse(res, { message: 'Team deleted successfully' });
  }
}

export const teamsController = new TeamsController();
