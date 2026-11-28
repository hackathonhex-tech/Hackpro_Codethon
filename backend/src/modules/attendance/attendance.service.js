import { attendanceRepository } from './attendance.repository.js';
import { participantRepository } from '../participants/participants.repository.js';
import { userRepository } from '../users/users.repository.js';
import { teamRepository } from '../teams/teams.repository.js';
import { assignmentRepository } from '../assignments/assignments.repository.js';
import { contestRepository } from '../contests/contests.repository.js';
import { attemptRepository } from '../attempts/attempts.repository.js';
import { refreshTokenRepository } from '../auth/refreshToken.repository.js';
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
    const allTokens = await refreshTokenRepository.find({ isRevoked: false });

    // Build complete roster of assigned participants
    const assignedParticipantIds = new Set();
    assignments.forEach((a) => {
      if (a.participantId) assignedParticipantIds.add(String(a.participantId));
      if (a.teamId) {
        const team = allTeams.find((t) => String(t.id) === String(a.teamId) || String(t._id) === String(a.teamId));
        (team?.memberIds || []).forEach((mId) => assignedParticipantIds.add(String(mId)));
      }
    });

    const cleanStr = (s) => (s && typeof s === 'string' ? s.trim() : '');
    const normalizeEmail = (e) => {
      const s = cleanStr(e).toLowerCase();
      return (!s || s === '—' || s === 'null' || s === 'undefined') ? '' : s;
    };
    const normalizeRoll = (r) => {
      const s = cleanStr(r).replace(/^EMP/i, '').toLowerCase();
      return (!s || s === '—' || s === 'null' || s === 'undefined') ? '' : s;
    };
    const cleanId = (id) => (id ? String(id).trim() : '');

    // Canonical roster and deduplication indices
    const canonicalRoster = [];
    const emailIndex = new Map();
    const rollIndex = new Map();
    const idIndex = new Map();

    const upsertCandidate = (item) => {
      const normEmail = normalizeEmail(item.email);
      const normRoll = normalizeRoll(item.rollNumber);
      const ids = [item.userId, item.participantId, item.id, item._id].map(cleanId).filter(Boolean);

      let existing = null;
      if (normEmail && emailIndex.has(normEmail)) {
        existing = emailIndex.get(normEmail);
      } else if (normRoll && rollIndex.has(normRoll)) {
        existing = rollIndex.get(normRoll);
      } else {
        for (const id of ids) {
          if (id && idIndex.has(id)) {
            existing = idIndex.get(id);
            break;
          }
        }
      }

      if (existing) {
        // Merge attributes
        if ((!existing.email || existing.email === '—') && item.email && item.email !== '—') {
          existing.email = item.email;
        }
        if ((!existing.rollNumber || existing.rollNumber === '—') && item.rollNumber && item.rollNumber !== '—') {
          existing.rollNumber = item.rollNumber;
        }
        if ((!existing.name || existing.name === 'Candidate') && item.name && item.name !== 'Candidate') {
          existing.name = item.name;
          existing.participantName = item.name;
        }
        if ((!existing.participantName || existing.participantName === 'Candidate') && item.participantName && item.participantName !== 'Candidate') {
          existing.participantName = item.participantName;
        }
        if ((!existing.department || existing.department === '—') && item.department && item.department !== '—') {
          existing.department = item.department;
        }
        if (!existing.teamName && item.teamName) {
          existing.teamName = item.teamName;
          existing.teamId = item.teamId;
        }

        // Status priority: completed (Submitted) > present (Started / Logged in) > absent
        if (item.status === 'completed') {
          existing.status = 'completed';
          existing.loginStatus = 'Submitted';
        } else if (item.status === 'present' && existing.status !== 'completed') {
          existing.status = 'present';
          existing.loginStatus = item.loginStatus || 'Logged in';
        }

        if (item.startedAt && (!existing.startedAt || new Date(item.startedAt) < new Date(existing.startedAt))) {
          existing.startedAt = item.startedAt;
          existing.testStartTimestamp = item.startedAt;
        }
        if (item.submittedAt && (!existing.submittedAt || new Date(item.submittedAt) > new Date(existing.submittedAt))) {
          existing.submittedAt = item.submittedAt;
          existing.submitTimestamp = item.submittedAt;
        }
        if (item.loginTimestamp && !existing.loginTimestamp) {
          existing.loginTimestamp = item.loginTimestamp;
        }
        if (item.durationMinutes && item.durationMinutes > (existing.durationMinutes || 0)) {
          existing.durationMinutes = item.durationMinutes;
        }

        // Re-index all keys pointing to this merged candidate
        const updatedEmail = normalizeEmail(existing.email);
        const updatedRoll = normalizeRoll(existing.rollNumber);
        if (updatedEmail) emailIndex.set(updatedEmail, existing);
        if (updatedRoll) rollIndex.set(updatedRoll, existing);
        for (const id of ids) {
          if (id) idIndex.set(id, existing);
        }
        if (existing.userId) idIndex.set(cleanId(existing.userId), existing);
        if (existing.participantId) idIndex.set(cleanId(existing.participantId), existing);
        if (existing.id) idIndex.set(cleanId(existing.id), existing);
        return existing;
      }

      // Insert new entry
      const entry = {
        id: item.id || `att_${ids[0] || Math.random().toString(36).slice(2)}`,
        _id: item._id || item.id || `att_${ids[0] || Math.random().toString(36).slice(2)}`,
        userId: item.userId || ids[0] || null,
        participantId: item.participantId || ids[0] || null,
        name: item.name || item.participantName || 'Candidate',
        participantName: item.participantName || item.name || 'Candidate',
        email: item.email || '—',
        rollNumber: item.rollNumber || '—',
        department: item.department || '—',
        contestTitle: contest?.title || 'Assessment Contest',
        batchCode: contest?.batchCode || '—',
        teamId: item.teamId || null,
        teamName: item.teamName || undefined,
        status: item.status || 'absent',
        loginStatus: item.loginStatus || 'Not logged in',
        loginTimestamp: item.loginTimestamp || null,
        testStartTimestamp: item.testStartTimestamp || item.startedAt || null,
        submitTimestamp: item.submitTimestamp || item.submittedAt || null,
        startedAt: item.startedAt || item.testStartTimestamp || null,
        submittedAt: item.submittedAt || item.submitTimestamp || null,
        durationMinutes: item.durationMinutes || 0,
      };

      canonicalRoster.push(entry);
      if (normEmail) emailIndex.set(normEmail, entry);
      if (normRoll) rollIndex.set(normRoll, entry);
      for (const id of ids) {
        if (id) idIndex.set(id, entry);
      }
      return entry;
    };

    // Determine whether to populate the roster with all registered candidates (e.g. 630 candidates)
    // or only assigned candidates. When contest has batchCode (CODE2026), or no explicit assignments exist,
    // or assignments cover the bulk of participants (>= 500 or >= 70%), include the full candidate pool.
    const isFullBatchContest =
      Boolean(contest?.batchCode) ||
      assignments.length === 0 ||
      (allParticipants.length > 0 && assignments.length >= Math.min(500, allParticipants.length * 0.7));

    const poolParticipants = isFullBatchContest
      ? allParticipants
      : allParticipants.filter((p) => {
          const pid = String(p.id || p._id || p.userId);
          return assignedParticipantIds.has(pid);
        });

    // 1. Seed base roster from participants
    for (const p of poolParticipants) {
      const user = allUsers.find((u) =>
        (u.email && p.email && u.email.toLowerCase() === p.email.toLowerCase()) ||
        (u.rollNumber && p.rollNumber && u.rollNumber.toLowerCase() === p.rollNumber.toLowerCase()) ||
        String(u.id) === String(p.id) ||
        String(u._id) === String(p.id) ||
        String(u.id) === String(p.userId)
      );
      const team = p.teamId ? allTeams.find((t) => String(t.id) === String(p.teamId)) : null;

      upsertCandidate({
        id: p.id || p._id,
        _id: p._id || p.id,
        userId: user?.id || user?._id || p.userId || p.id,
        participantId: p.id || p._id,
        name: p.name || user?.name || 'Candidate',
        participantName: p.name || user?.name || 'Candidate',
        email: p.email || user?.email || '—',
        rollNumber: p.rollNumber || user?.rollNumber || '—',
        department: p.department || user?.department || '—',
        teamId: team?.id || null,
        teamName: team?.name || undefined,
        status: 'absent',
        loginStatus: 'Not logged in',
      });
    }

    // 2. Merge candidate attempts (test started or submitted)
    for (const attempt of allAttempts) {
      const attStatus = attempt.status === 'submitted' ? 'completed' : 'present';
      const attLogin = attempt.status === 'submitted' ? 'Submitted' : 'Logged in';
      upsertCandidate({
        userId: attempt.userId,
        name: attempt.userName,
        participantName: attempt.userName,
        rollNumber: attempt.userRoll,
        status: attStatus,
        loginStatus: attLogin,
        startedAt: attempt.startedAt || null,
        testStartTimestamp: attempt.startedAt || null,
        submittedAt: attempt.submittedAt || null,
        submitTimestamp: attempt.submittedAt || null,
        durationMinutes: attempt.durationMinutes || 0,
      });
    }

    // 3. Merge attendance records for this contest
    for (const record of records) {
      const recStatus = record.status || 'absent';
      const recLogin = record.loginStatus || (recStatus !== 'absent' ? 'Logged in' : 'Not logged in');
      upsertCandidate({
        userId: record.userId,
        name: record.userName,
        participantName: record.userName,
        rollNumber: record.rollNumber,
        email: record.userEmail,
        status: recStatus,
        loginStatus: recLogin,
        loginTimestamp: record.loginTimestamp || null,
        startedAt: record.testStartTimestamp || record.startedAt || record.loginTimestamp || null,
        testStartTimestamp: record.testStartTimestamp || record.startedAt || record.loginTimestamp || null,
        submittedAt: record.submitTimestamp || record.submittedAt || null,
        submitTimestamp: record.submitTimestamp || record.submittedAt || null,
        durationMinutes: record.durationMinutes || 0,
      });
    }

    // 4. Retroactive login reconciliation: mark candidates with active login sessions as present
    for (const token of allTokens) {
      const tUserId = cleanId(token.userId);
      if (!tUserId) continue;

      let candidate = idIndex.get(tUserId);
      if (!candidate) {
        const u = allUsers.find((usr) => String(usr.id) === tUserId || String(usr._id) === tUserId);
        if (u) {
          const normUe = normalizeEmail(u.email);
          const normUr = normalizeRoll(u.rollNumber);
          candidate = (normUe && emailIndex.get(normUe)) || (normUr && rollIndex.get(normUr));
        }
      }

      if (candidate && candidate.status === 'absent') {
        candidate.status = 'present';
        candidate.loginStatus = 'Logged in';
        if (!candidate.startedAt) {
          candidate.startedAt = token.createdAt || new Date().toISOString();
          candidate.testStartTimestamp = candidate.startedAt;
        }
      }
    }

    // Compute live duration for in-progress candidates
    for (const item of canonicalRoster) {
      if (item.testStartTimestamp && (!item.durationMinutes || item.durationMinutes === 0)) {
        const startMs = new Date(item.testStartTimestamp).getTime();
        const endMs = item.submitTimestamp ? new Date(item.submitTimestamp).getTime() : Date.now();
        if (!isNaN(startMs) && !isNaN(endMs) && endMs >= startMs) {
          item.durationMinutes = Math.round((endMs - startMs) / 60000);
        }
      }
    }

    let filtered = canonicalRoster;
    if (query.status) {
      filtered = filtered.filter((r) => r.status === query.status);
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      filtered = filtered.filter((r) =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.participantName && r.participantName.toLowerCase().includes(q)) ||
        (r.rollNumber && r.rollNumber.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q))
      );
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

    const totalAssigned = canonicalRoster.length;
    const totalPresent = canonicalRoster.filter((r) => r.status === 'present' || r.status === 'completed').length;
    const totalSubmitted = canonicalRoster.filter((r) => r.status === 'completed').length;
    const totalStarted = canonicalRoster.filter((r) => r.status === 'present').length;
    const totalAbsent = Math.max(0, totalAssigned - totalPresent);

    return {
      totalAssigned,
      totalPresent,
      totalSubmitted,
      totalStarted,
      totalAbsent,
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
