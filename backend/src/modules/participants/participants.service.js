import crypto from 'crypto';
import { participantRepository } from './participants.repository.js';
import { userRepository } from '../users/users.repository.js';
import { teamRepository } from '../teams/teams.repository.js';
import { hashPassword } from '../../utils/password.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import { SYSTEM_ROLES } from '@codeathon/shared';
import { parseCsv } from '../../utils/csv.js';

const sanitizeParticipant = (p) => {
  if (!p) return p;
  const { plainPasswordPreview, password, ...safe } = p;
  return safe;
};

export class ParticipantsService {
  async getAllParticipants(options = {}) {
    let list = await participantRepository.find({});
    const allTeams = await teamRepository.find({});
    list = list.map((p) => {
      const team = p.teamId ? allTeams.find((t) => String(t.id) === String(p.teamId)) : null;
      return {
        ...p,
        teamName: team ? team.name : (p.teamName || null),
      };
    });
    if (options.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.rollNumber.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
      );
    }
    if (options.teamId) {
      list = list.filter((p) => p.teamId === options.teamId);
    }
    return list.map(sanitizeParticipant);
  }

  async getParticipantById(id) {
    const item = await participantRepository.findById(id);
    if (!item) throw ApiError.notFound('Participant not found');
    return sanitizeParticipant(item);
  }

  async createParticipant(data) {
    if (!data.email || !data.email.trim()) {
      throw ApiError.badRequest('Email address is required');
    }
    const emailLower = data.email.toLowerCase().trim();

    // Auto-derive name from email if not provided
    let name = (data.name || '').trim();
    if (!name) {
      const emailUserPart = emailLower.split('@')[0].replace(/[._-]/g, ' ');
      name = emailUserPart.charAt(0).toUpperCase() + emailUserPart.slice(1);
    }

    // Auto-generate or derive rollNumber (Superset ID) if not provided
    let rollUpper = (data.rollNumber || data.supersetId || data.employeeId || '').trim().toUpperCase();
    if (!rollUpper) {
      rollUpper = ('EMP' + Math.floor(100000 + Math.random() * 900000)).toUpperCase();
    }

    const existingEmail = await userRepository.findByEmail(emailLower);
    if (existingEmail) {
      const existingParticipant = await participantRepository.findByEmail(emailLower);
      if (existingParticipant) {
        return sanitizeParticipant(existingParticipant);
      }
    }

    const plainPassword =
      data.password && data.password.trim().length >= 6
        ? data.password.trim()
        : env.DEFAULT_STUDENT_PASSWORD || crypto.randomBytes(9).toString('base64url');
    const hashedPassword = await hashPassword(plainPassword);

    // Create participant user login
    const user = await userRepository.create({
      name,
      email: emailLower,
      rollNumber: rollUpper,
      password: hashedPassword,
      role: SYSTEM_ROLES.STUDENT,
      roleId: SYSTEM_ROLES.STUDENT,
      roleName: 'Student',
      isActive: true,
    });

    const participant = await participantRepository.create({
      id: user.id,
      userId: user.id,
      rollNumber: rollUpper,
      name,
      email: emailLower,
      department: data.department || 'General',
      yearOrSemester: data.yearOrSemester || 'Final Year',
      teamId: data.teamId || null,
    });

    return sanitizeParticipant(participant);
  }

  async bulkImportCsv(csvString) {
    const rows = parseCsv(csvString);
    if (!rows.length) {
      throw ApiError.badRequest('CSV content is empty or headers are missing. Required: email');
    }

    const results = {
      imported: 0,
      errors: [],
    };

    // Pre-calculate default student password hash ONCE for the entire batch
    const defaultPlainPassword = env.DEFAULT_STUDENT_PASSWORD || 'Hackpro@2026';
    const defaultHashedPassword = await hashPassword(defaultPlainPassword);

    // Pre-fetch all existing users & participants into memory maps for O(1) instant checking
    const allUsers = await userRepository.find({});
    const allParticipants = await participantRepository.find({});

    const existingUserMap = new Map();
    for (const u of allUsers) {
      if (u.email) existingUserMap.set(u.email.toLowerCase().trim(), u);
    }

    const existingParticipantMap = new Map();
    for (const p of allParticipants) {
      if (p.email) existingParticipantMap.set(p.email.toLowerCase().trim(), p);
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const email = (
          row.email ||
          row['Email'] ||
          row['EMAIL'] ||
          row['Email Address'] ||
          row['emailAddress'] ||
          row['Email ID'] ||
          row['email id'] ||
          row['Mail ID'] ||
          row['mail id'] ||
          row['MailId'] ||
          row['mailId'] ||
          row['Mail'] ||
          row['mail'] ||
          row['e-mail'] ||
          Object.values(row).find((v) => typeof v === 'string' && v.includes('@')) ||
          ''
        ).trim().toLowerCase();

        if (!email) {
          continue;
        }

        let name = (
          row.name ||
          row['Name'] ||
          row['NAME'] ||
          row['Candidate Name'] ||
          row['candidateName'] ||
          row['Student Name'] ||
          row['studentName'] ||
          row.fullName ||
          row['Full Name'] ||
          ''
        ).trim();

        if (!name) {
          const emailUserPart = email.split('@')[0].replace(/[._-]/g, ' ');
          name = emailUserPart.charAt(0).toUpperCase() + emailUserPart.slice(1);
        }

        let rollUpper = (
          row.supersetId ||
          row.superset_id ||
          row['Superset ID'] ||
          row['Superset Id'] ||
          row['superset id'] ||
          row['SUPERSET ID'] ||
          row['Super Set ID'] ||
          row['super set id'] ||
          row['Super Set Id'] ||
          row.employeeId ||
          row['Employee ID'] ||
          row['EmployeeId'] ||
          row.empId ||
          row['Emp ID'] ||
          row.rollNumber ||
          row['Roll Number'] ||
          row.roll_no ||
          row['Roll No'] ||
          row.id ||
          ''
        ).trim().toUpperCase();

        if (!rollUpper) {
          rollUpper = ('EMP' + Math.floor(100000 + Math.random() * 900000)).toUpperCase();
        }

        const department = (row.department || row['Department'] || 'General').trim();
        const customPassword = (row.password || row['Password'] || '').trim();

        let hashedPassword = defaultHashedPassword;
        if (customPassword && customPassword.length >= 6) {
          hashedPassword = await hashPassword(customPassword);
        }

        // Check if user already exists
        let user = existingUserMap.get(email);
        if (!user) {
          user = await userRepository.create({
            name,
            email,
            rollNumber: rollUpper,
            password: hashedPassword,
            role: SYSTEM_ROLES.STUDENT,
            roleId: SYSTEM_ROLES.STUDENT,
            roleName: 'Student',
            isActive: true,
          });
          existingUserMap.set(email, user);
        } else {
          if (rollUpper && user.rollNumber !== rollUpper) {
            await userRepository.update(user.id, { rollNumber: rollUpper, name });
            user.rollNumber = rollUpper;
            user.name = name;
          }
        }

        // Check if participant already exists
        let participant = existingParticipantMap.get(email);
        if (!participant) {
          participant = await participantRepository.create({
            id: user.id,
            userId: user.id,
            rollNumber: rollUpper,
            name,
            email,
            department,
            yearOrSemester: 'Final Year',
            teamId: null,
          });
          existingParticipantMap.set(email, participant);
        } else {
          if (rollUpper && participant.rollNumber !== rollUpper) {
            await participantRepository.update(participant.id, { rollNumber: rollUpper, name });
            participant.rollNumber = rollUpper;
            participant.name = name;
          }
        }

        results.imported++;
      } catch (err) {
        results.errors.push({ row: i + 2, error: err.message });
      }
    }

    return results;
  }

  async deleteAllParticipants() {
    const allParticipants = await participantRepository.find({});
    const participantIds = allParticipants.map((p) => String(p.id || p._id || p.userId));

    for (const p of allParticipants) {
      await participantRepository.delete(p.id || p._id);
    }

    for (const pId of participantIds) {
      await userRepository.delete(pId);
    }

    return {
      deletedCount: participantIds.length,
      message: `Successfully deleted all ${participantIds.length} candidate records.`,
    };
  }

  async updateParticipant(id, updates) {
    const item = await participantRepository.findById(id);
    if (!item) throw ApiError.notFound('Participant not found');

    if (updates.name || updates.department || updates.teamId !== undefined) {
      await participantRepository.update(id, {
        ...(updates.name ? { name: updates.name } : {}),
        ...(updates.department ? { department: updates.department } : {}),
        ...(updates.teamId !== undefined ? { teamId: updates.teamId } : {}),
      });
      await userRepository.update(id, {
        ...(updates.name ? { name: updates.name } : {}),
      });
    }

    return sanitizeParticipant(await participantRepository.findById(id));
  }

  async deleteParticipant(id) {
    const item = await participantRepository.findById(id);
    if (!item) throw ApiError.notFound('Participant not found');
    await participantRepository.delete(id);
    await userRepository.delete(id);
    return true;
  }
}

export const participantsService = new ParticipantsService();
