import { attendanceRepository } from './attendance.repository.js';
import { participantRepository } from '../participants/participants.repository.js';
import { userRepository } from '../users/users.repository.js';
import { teamRepository } from '../teams/teams.repository.js';
import { assignmentRepository } from '../assignments/assignments.repository.js';
import { contestRepository } from '../contests/contests.repository.js';
import { attemptRepository } from '../attempts/attempts.repository.js';
import { toCsv } from '../../utils/csv.js';

export class AttendanceService {
  async getAttendanceByContest(contestId, query = {}) {
    const contest = await contestRepository.findById(contestId);
    const records = await attendanceRepository.findByContest(contestId);
    const assignments = await assignmentRepository.findByContest(contestId);
    const allParticipants = await participantRepository.find({});
    const allUsers = await userRepository.find({});
    const allTeams = await teamRepository.find({});
    const allAttempts = await attemptRepository.find({ contestId });

    // Build complete roster of assigned participants (whether they have started or not)
    const assignedParticipantIds = new Set();
    assignments.forEach((a) => {
      if (a.participantId) assignedParticipantIds.add(a.participantId);
      if (a.teamId) {
        const team = allTeams.find((t) => t.id === a.teamId);
        (team?.memberIds || []).forEach((mId) => assignedParticipantIds.add(mId));
      }
    });

    const roster = [];

    // Include all assigned participants, recorded attendees, or candidates with attempts
    const relevantParticipantIds = new Set([
      ...assignedParticipantIds,
      ...records.map((r) => r.userId),
      ...allAttempts.map((a) => a.userId),
    ]);

    for (const pId of relevantParticipantIds) {
      const participant = allParticipants.find((p) => String(p.id) === String(pId) || String(p._id) === String(pId));
      const user = allUsers.find((u) => String(u.id) === String(pId) || String(u._id) === String(pId));
      const record = records.find((r) => String(r.userId) === String(pId));
      const attempt = allAttempts.find((a) => String(a.userId) === String(pId));
      const team = participant?.teamId ? allTeams.find((t) => String(t.id) === String(participant.teamId)) : null;

      const resolvedName = user?.name || participant?.name || record?.userName || attempt?.userName || 'Candidate';
      const resolvedEmail = user?.email || participant?.email || record?.userEmail || '—';
      const resolvedRoll = user?.rollNumber || participant?.rollNumber || record?.rollNumber || attempt?.userRoll || '—';
      const resolvedDept = user?.department || participant?.department || '—';

      let currentStatus = record?.status || 'absent';
      let checkinTime = record?.testStartTimestamp || record?.startedAt || record?.loginTimestamp || null;
      let turninTime = record?.submitTimestamp || record?.submittedAt || null;
      let loginStatus = record?.loginStatus || (record?.status && record?.status !== 'absent' ? 'Logged in' : 'Not logged in');

      // Auto-reconcile with attempt: if student started the test, attendance is automatically marked as present
      if (attempt) {
        if (attempt.status === 'submitted') {
          currentStatus = 'completed';
          loginStatus = 'Submitted';
          turninTime = turninTime || attempt.submittedAt || attempt.updatedAt || null;
          checkinTime = checkinTime || attempt.startedAt || null;
        } else if (attempt.status === 'in_progress' || attempt.startedAt) {
          if (currentStatus !== 'completed') {
            currentStatus = 'present';
            loginStatus = 'Logged in';
            checkinTime = checkinTime || attempt.startedAt || null;
          }
        }
      }

      let durationMinutes = record?.durationMinutes || 0;
      if (checkinTime) {
        const startMs = new Date(checkinTime).getTime();
        const endMs = turninTime ? new Date(turninTime).getTime() : Date.now();
        if (!isNaN(startMs) && !isNaN(endMs) && endMs >= startMs) {
          durationMinutes = Math.round((endMs - startMs) / 60000);
        }
      }

      roster.push({
        id: record?.id || `att_${pId}`,
        _id: record?.id || `att_${pId}`,
        userId: pId,
        participantId: pId,
        participantName: resolvedName,
        email: resolvedEmail,
        rollNumber: resolvedRoll,
        name: resolvedName,
        department: resolvedDept,
        contestTitle: contest?.title || 'Assessment Contest',
        batchCode: contest?.batchCode || '—',
        teamId: team?.id || null,
        teamName: team?.name || undefined,
        status: currentStatus,
        loginStatus,
        loginTimestamp: record?.loginTimestamp || checkinTime,
        testStartTimestamp: checkinTime,
        submitTimestamp: turninTime,
        startedAt: checkinTime,
        submittedAt: turninTime,
        durationMinutes,
      });
    }

    let filtered = roster;
    if (query.status) {
      filtered = filtered.filter((r) => r.status === query.status);
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      filtered = filtered.filter((r) => r.name.toLowerCase().includes(q) || r.rollNumber.toLowerCase().includes(q));
    }
    if (query.teamId) {
      filtered = filtered.filter((r) => r.teamId === query.teamId);
    }

    // Team aggregated view
    const teamGroups = {};
    filtered.forEach((item) => {
      const tKey = item.teamId || 'individual';
      if (!teamGroups[tKey]) {
        teamGroups[tKey] = {
          teamId: item.teamId,
          teamName: item.teamName,
          totalMembers: 0,
          presentCount: 0,
          submittedCount: 0,
          students: [],
        };
      }
      teamGroups[tKey].totalMembers++;
      if (item.status === 'present' || item.status === 'completed') teamGroups[tKey].presentCount++;
      if (item.status === 'completed') teamGroups[tKey].submittedCount++;
      teamGroups[tKey].students.push(item);
    });

    const totalFiltered = filtered.length;
    let paginatedRecords = filtered;
    let pagination = null;

    if (query.page || query.limit) {
      const page = Math.max(1, parseInt(query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(query.limit || '15', 10)));
      const skip = (page - 1) * limit;
      paginatedRecords = filtered.slice(skip, skip + limit);
      pagination = {
        page,
        limit,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
      };
    }

    return {
      totalAssigned: roster.length,
      totalPresent: roster.filter((r) => r.status === 'present' || r.status === 'completed').length,
      totalSubmitted: roster.filter((r) => r.status === 'completed').length,
      records: paginatedRecords,
      totalRecords: totalFiltered,
      pagination: pagination || {
        page: 1,
        limit: totalFiltered,
        total: totalFiltered,
        totalPages: 1,
      },
      teams: Object.values(teamGroups),
    };
  }

  async exportCsv(contestId) {
    const data = await this.getAttendanceByContest(contestId);
    const contest = await contestRepository.findById(contestId);

    const formattedRecords = (data.records || []).map((r, index) => {
      const formatTime = (ts) => {
        if (!ts) return '—';
        try {
          const d = new Date(ts);
          return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'medium' });
        } catch {
          return '—';
        }
      };

      const resolvedStatus =
        r.status === 'completed' || r.status === 'present'
          ? 'Present'
          : 'Absent';

      return {
        'S.No': index + 1,
        'Candidate Name': r.name || r.participantName || 'Candidate',
        'Email Address': r.email || '—',
        'Superset ID': (r.rollNumber || '—').replace(/^EMP/i, ''),
        'Department': r.department || '—',
        'Contest Title': contest?.title || r.contestTitle || 'Assessment Contest',
        'Batch Code': contest?.batchCode || r.batchCode || '—',
        'Team Allocation': r.teamName || 'Individual',
        'Attendance Status': resolvedStatus,
        'Login Status': r.loginStatus || (r.status !== 'absent' ? 'Logged In' : 'Not Logged In'),
      };
    });

    if (formattedRecords.length === 0) {
      return 'S.No,Candidate Name,Email Address,Superset ID,Department,Contest Title,Batch Code,Team Allocation,Attendance Status,Login Status\n';
    }

    return toCsv(formattedRecords);
  }

  async markAttendance(contestId, userId, status = 'present') {
    let existing = await attendanceRepository.findByContestAndUser(contestId, userId);
    const now = new Date().toISOString();
    if (existing) {
      existing.status = status;
      if (status === 'present' && !existing.testStartTimestamp) {
        existing.testStartTimestamp = now;
      } else if (status === 'completed' && !existing.submitTimestamp) {
        existing.submitTimestamp = now;
      }
      return await attendanceRepository.update(existing.id, existing);
    } else {
      return await attendanceRepository.create({
        contestId,
        userId,
        status,
        loginStatus: 'Manual Status Update',
        testStartTimestamp: status !== 'absent' ? now : null,
        submitTimestamp: status === 'completed' ? now : null,
        durationMinutes: 0,
      });
    }
  }
}

export const attendanceService = new AttendanceService();
