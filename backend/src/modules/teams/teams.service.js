import { teamRepository } from './teams.repository.js';
import { participantRepository } from '../participants/participants.repository.js';
import { ApiError } from '../../utils/ApiError.js';

export class TeamsService {
  async getAllTeams() {
    const teams = await teamRepository.find({});
    // Populate members
    const allParticipants = await participantRepository.find({});
    return teams.map((team) => {
      const members = allParticipants.filter((p) => (team.memberIds || []).includes(p.id) || p.teamId === team.id);
      return {
        ...team,
        members,
        memberCount: members.length,
      };
    });
  }

  async getTeamById(id) {
    const team = await teamRepository.findById(id);
    if (!team) throw ApiError.notFound('Team not found');
    const members = await participantRepository.find({ teamId: id });
    return {
      ...team,
      members,
    };
  }

  async createTeam(data) {
    const team = await teamRepository.create({
      name: data.name,
      description: data.description || '',
      leaderId: data.leaderId || null,
      memberIds: data.memberIds || [],
    });

    if (data.memberIds && data.memberIds.length) {
      for (const mId of data.memberIds) {
        await participantRepository.update(mId, { teamId: team.id });
      }
    }

    return team;
  }

  async updateTeam(id, updates) {
    const team = await teamRepository.findById(id);
    if (!team) throw ApiError.notFound('Team not found');

    if (updates.memberIds) {
      // Unset previous members
      const prevMembers = await participantRepository.find({ teamId: id });
      for (const p of prevMembers) {
        await participantRepository.update(p.id, { teamId: null });
      }
      // Set new members
      for (const mId of updates.memberIds) {
        await participantRepository.update(mId, { teamId: id });
      }
    }

    return teamRepository.update(id, updates);
  }

  async deleteTeam(id) {
    const team = await teamRepository.findById(id);
    if (!team) throw ApiError.notFound('Team not found');
    // Unassign members
    const members = await participantRepository.find({ teamId: id });
    for (const p of members) {
      await participantRepository.update(p.id, { teamId: null });
    }
    return teamRepository.delete(id);
  }
}

export const teamsService = new TeamsService();
