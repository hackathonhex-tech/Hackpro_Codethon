import { assignmentRepository } from './assignments.repository.js';
import { participantRepository } from '../participants/participants.repository.js';
import { teamRepository } from '../teams/teams.repository.js';
import { attemptRepository } from '../attempts/attempts.repository.js';
import { answerRepository } from '../attempts/answers.repository.js';
import { submissionRepository } from '../submissions/submissions.repository.js';
import { attendanceRepository } from '../attendance/attendance.repository.js';

export class AssignmentsService {
  async getAssignmentsByContest(contestId) {
    const list = await assignmentRepository.findByContest(contestId);
    const allParticipants = await participantRepository.find({});
    const allTeams = await teamRepository.find({});

    const validList = [];
    for (const a of list) {
      let participant = null;
      let team = null;
      if (a.participantId) {
        participant = allParticipants.find((p) => p.id === a.participantId) || null;
      }
      if (a.teamId) {
        team = allTeams.find((t) => t.id === a.teamId) || null;
      }
      // If candidate/team was deleted, remove the stale assignment
      if (!participant && !team) {
        if (a.id) assignmentRepository.delete(a.id).catch(() => {});
        continue;
      }
      validList.push({
        ...a,
        participant,
        team,
      });
    }

    return validList;
  }

  async assign(contestId, participantIds = [], teamIds = []) {
    const created = [];
    const existingAssignments = await assignmentRepository.findByContest(contestId);
    const existingParticipantSet = new Set(
      existingAssignments.map((a) => String(a.participantId))
    );
    const existingTeamSet = new Set(
      existingAssignments.map((a) => String(a.teamId))
    );

    const now = new Date().toISOString();

    for (const pId of participantIds) {
      const sId = String(pId);
      if (!existingParticipantSet.has(sId)) {
        const item = await assignmentRepository.create({
          contestId,
          participantId: sId,
          teamId: null,
          assignedAt: now,
        });
        existingParticipantSet.add(sId);
        created.push(item);
      }
    }

    for (const tId of teamIds) {
      const sId = String(tId);
      if (!existingTeamSet.has(sId)) {
        const item = await assignmentRepository.create({
          contestId,
          participantId: null,
          teamId: sId,
          assignedAt: now,
        });
        existingTeamSet.add(sId);
        created.push(item);
      }
    }

    return created;
  }

  async unassign(contestId, participantId = null, teamId = null) {
    if (participantId) {
      const item = await assignmentRepository.findOne({ contestId, participantId });
      if (item) await assignmentRepository.delete(item.id);

      // Clean up attempt, answers, submissions, and attendance for this participant in this contest
      const attempt = await attemptRepository.findByContestAndUser(contestId, participantId);
      if (attempt) {
        await attemptRepository.delete(attempt.id);
        await answerRepository.deleteMany({ attemptId: attempt.id });
        await submissionRepository.deleteMany({ attemptId: attempt.id });
        const att = await attendanceRepository.findByContestAndUser(contestId, participantId);
        if (att) await attendanceRepository.delete(att.id);
      }
    }
    if (teamId) {
      const item = await assignmentRepository.findOne({ contestId, teamId });
      if (item) await assignmentRepository.delete(item.id);
    }
    return true;
  }
}

export const assignmentsService = new AssignmentsService();
