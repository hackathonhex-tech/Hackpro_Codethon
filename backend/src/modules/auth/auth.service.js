import { userRepository } from '../users/users.repository.js';
import { roleRepository } from '../roles/roles.repository.js';
import { refreshTokenRepository } from './refreshToken.repository.js';
import { contestRepository } from '../contests/contests.repository.js';
import { assignmentRepository } from '../assignments/assignments.repository.js';
import { participantRepository } from '../participants/participants.repository.js';
import { attendanceRepository } from '../attendance/attendance.repository.js';
import { comparePassword, hashPassword } from '../../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { ApiError } from '../../utils/ApiError.js';
import { SYSTEM_ROLES, ALL_PERMISSIONS } from '@codeathon/shared';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  async login(identifier, password) {
    const rawPass = String(password || '').trim();
    const cleanId = String(identifier || '').trim();

    // Check if the provided password matches any contest's batchCode
    const allContests = await contestRepository.find({});
    const matchedBatchContest = allContests.find(
      (c) => c.batchCode && c.batchCode.trim().toLowerCase() === rawPass.toLowerCase()
    );

    let user = await userRepository.findByIdentifier(cleanId);

    // If batchCode matches and user doesn't exist yet, auto-create student user and participant
    if (matchedBatchContest && !user) {
      const emailLower = cleanId.toLowerCase();
      let participant = await participantRepository.findByEmail(emailLower);
      const namePart = emailLower.split('@')[0].replace(/[._]/g, ' ');
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const generatedRoll = participant?.rollNumber || ('EMP' + Math.floor(100000 + Math.random() * 900000));
      const hashed = await hashPassword(rawPass);

      user = await userRepository.create({
        name: participant?.name || formattedName,
        email: emailLower,
        rollNumber: generatedRoll,
        password: hashed,
        role: SYSTEM_ROLES.STUDENT,
        roleId: SYSTEM_ROLES.STUDENT,
        roleName: 'Student',
        isActive: true,
      });

      if (!participant) {
        await participantRepository.create({
          id: user.id,
          name: formattedName,
          email: emailLower,
          rollNumber: generatedRoll,
          college: `Batch ${matchedBatchContest.batchCode}`,
        });
      }
    }

    if (!user) {
      throw ApiError.unauthorized('Invalid email or batch code / password', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact an administrator.', 'ACCOUNT_DEACTIVATED');
    }

    let isMatch = false;

    const isStaffAccount =
      user &&
      user.role !== SYSTEM_ROLES.STUDENT &&
      user.role !== 'candidate' &&
      user.role !== 'participant';

    // If batchCode matched a contest, authenticate ONLY student/candidate accounts & assign contest (never bypass password for staff/admin!)
    if (matchedBatchContest && !isStaffAccount) {
      isMatch = true;
      const isAssigned = await assignmentRepository.isAssigned(matchedBatchContest.id, user.id);
      if (!isAssigned) {
        await assignmentRepository.create({
          contestId: matchedBatchContest.id,
          participantId: user.id,
          assignedAt: new Date().toISOString(),
        });
      }
    } else {
      isMatch = await comparePassword(password, user.password);
    }

    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email/roll number or password', 'INVALID_CREDENTIALS');
    }

    // Auto-mark candidate attendance as Present immediately upon login with access key or credentials
    if (!isStaffAccount) {
      const nowIso = new Date().toISOString();
      const targetContests = [];
      if (matchedBatchContest) {
        targetContests.push(matchedBatchContest);
      }

      // Also include contests assigned to this student or matching student batchCode
      const studentBatch = String(user.batchCode || '').trim().toLowerCase();
      for (const c of allContests) {
        if (targetContests.some((tc) => String(tc.id) === String(c.id))) continue;
        if (studentBatch && c.batchCode && c.batchCode.trim().toLowerCase() === studentBatch) {
          targetContests.push(c);
        }
      }

      try {
        const userAssignments = await assignmentRepository.findByParticipant(user.id);
        for (const a of userAssignments || []) {
          const cId = a.contestId || a.id;
          const assignedC = allContests.find((c) => String(c.id) === String(cId) || String(c._id) === String(cId));
          if (assignedC && !targetContests.some((tc) => String(tc.id) === String(assignedC.id))) {
            targetContests.push(assignedC);
          }
        }
      } catch (_) {}

      // If no contest matched yet, but there is an active/live contest or only 1 contest
      if (targetContests.length === 0 && allContests.length > 0) {
        const liveContests = allContests.filter((c) => c.status === 'live' || !c.isTurnedOff);
        if (liveContests.length === 1) {
          targetContests.push(liveContests[0]);
        }
      }

      for (const targetContest of targetContests) {
        try {
          const cId = targetContest.id || targetContest._id;
          const existingAtt = await attendanceRepository.findByContestAndUser(cId, user.id);
          if (existingAtt) {
            if (existingAtt.status !== 'completed') {
              await attendanceRepository.update(existingAtt.id, {
                status: 'present',
                loginStatus: 'Logged in',
                userEmail: user.email,
                rollNumber: user.rollNumber,
                loginTimestamp: existingAtt.loginTimestamp || nowIso,
              });
            }
          } else {
            await attendanceRepository.create({
              contestId: cId,
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              rollNumber: user.rollNumber,
              teamId: null,
              status: 'present',
              loginStatus: 'Logged in',
              loginTimestamp: nowIso,
              testStartTimestamp: null,
              submitTimestamp: null,
              durationMinutes: 0,
            });
          }
        } catch (_) {}
      }
    }

    // Resolve user's permissions
    let permissions = [];
    let roleName = user.roleName || user.role;
    if (user.role === SYSTEM_ROLES.SUPER_ADMIN) {
      const superRole = await roleRepository.findById(SYSTEM_ROLES.SUPER_ADMIN);
      permissions = superRole?.permissions || [];
      roleName = 'Super Admin';
    } else {
      const roleKey = user.roleId || user.role;
      let role = await roleRepository.findById(roleKey);
      if (!role && roleKey) {
        const normalized = String(roleKey).toLowerCase().replace(/\s+/g, '_');
        role = await roleRepository.findById(normalized);
      }
      if (!role && user.roleName) {
        role = await roleRepository.findOne({ name: { $regex: new RegExp(`^${user.roleName}$`, 'i') } });
      }
      if (role) {
        permissions = role.permissions || [];
        roleName = role.name;
      }
    }

    const isSuper = user.role === SYSTEM_ROLES.SUPER_ADMIN;

    const tokenPayload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber,
      role: isSuper ? SYSTEM_ROLES.SUPER_ADMIN : user.role,
      roleName: isSuper ? 'Super Admin' : roleName,
      isSuperAdmin: isSuper,
      permissions: isSuper ? ALL_PERMISSIONS : permissions,
      contestScope: user.contestScope || [],
      batchCode: matchedBatchContest?.batchCode || user.batchCode || null,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ userId: user.id, tokenId: uuidv4() });

    // Store refresh token
    await refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      isRevoked: false,
    });

    // Compute role-based landing route & target portal
    let redirectPath = '/dashboard';
    let targetPortal = 'admin';

    const r = String(tokenPayload.role || '').toLowerCase();
    const rId = String(user.roleId || '').toLowerCase();
    const rName = String(tokenPayload.roleName || '').toLowerCase();

    if (r === 'student' || r === 'candidate' || r === 'participant' || rName.includes('student') || rName.includes('candidate')) {
      targetPortal = 'student';
      redirectPath = '/dashboard';
    } else if (r.includes('proctor') || rId.includes('proctor') || rName.includes('proctor')) {
      targetPortal = 'admin';
      redirectPath = '/proctoring';
    } else if (r.includes('evaluat') || r.includes('review') || rId.includes('evaluat') || rId.includes('review') || rName.includes('evaluat') || rName.includes('review')) {
      targetPortal = 'admin';
      redirectPath = '/submissions';
    } else if (r.includes('attendance') || rId.includes('attendance') || rName.includes('attendance')) {
      targetPortal = 'admin';
      redirectPath = '/attendance';
    } else if (r.includes('report') || rId.includes('report') || rName.includes('report')) {
      targetPortal = 'admin';
      redirectPath = '/reports';
    } else if (r === 'admin' || r.includes('contest') || rId.includes('contest') || rName.includes('contest') || r.includes('question') || rId.includes('question') || rName.includes('question')) {
      targetPortal = 'admin';
      redirectPath = '/contests';
    } else if (isSuper || r === 'super_admin' || rName.includes('super')) {
      targetPortal = 'admin';
      redirectPath = '/dashboard';
    } else {
      targetPortal = 'admin';
      redirectPath = '/dashboard';
    }

    return {
      user: tokenPayload,
      accessToken,
      refreshToken,
      redirectPath,
      targetPortal,
    };
  }

  async refreshToken(oldRefreshToken) {
    if (!oldRefreshToken) {
      throw ApiError.unauthorized('Refresh token required', 'REFRESH_TOKEN_REQUIRED');
    }

    const decoded = verifyRefreshToken(oldRefreshToken);
    if (!decoded) {
      throw ApiError.unauthorized('Invalid or expired refresh token', 'REFRESH_TOKEN_INVALID');
    }

    const tokenRecord = await refreshTokenRepository.findByToken(oldRefreshToken);
    if (!tokenRecord || tokenRecord.isRevoked) {
      // Possible reuse attack: revoke all tokens for this user
      await refreshTokenRepository.revokeAllForUser(decoded.userId);
      throw ApiError.unauthorized('Compromised refresh token reused. All sessions revoked.', 'TOKEN_COMPROMISED');
    }

    // Revoke old refresh token (rotation)
    await refreshTokenRepository.update(tokenRecord.id, { isRevoked: true });

    const user = await userRepository.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or deactivated');
    }

    // Resolve current permissions
    let permissions = [];
    let roleName = user.roleName || user.role;
    if (user.role === SYSTEM_ROLES.SUPER_ADMIN) {
      const superRole = await roleRepository.findById(SYSTEM_ROLES.SUPER_ADMIN);
      permissions = superRole?.permissions || [];
      roleName = 'Super Admin';
    } else {
      const roleKey = user.roleId || user.role;
      let role = await roleRepository.findById(roleKey);
      if (!role && roleKey) {
        const normalized = String(roleKey).toLowerCase().replace(/\s+/g, '_');
        role = await roleRepository.findById(normalized);
      }
      if (!role && user.roleName) {
        role = await roleRepository.findOne({ name: { $regex: new RegExp(`^${user.roleName}$`, 'i') } });
      }
      if (role) {
        permissions = role.permissions || [];
        roleName = role.name;
      }
    }

    const isSuper = user.role === SYSTEM_ROLES.SUPER_ADMIN;

    const tokenPayload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber,
      role: isSuper ? SYSTEM_ROLES.SUPER_ADMIN : user.role,
      roleName: isSuper ? 'Super Admin' : roleName,
      isSuperAdmin: isSuper,
      permissions: isSuper ? ALL_PERMISSIONS : permissions,
      contestScope: user.contestScope || [],
      batchCode: user.batchCode || null,
    };

    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken({ userId: user.id, tokenId: uuidv4() });

    await refreshTokenRepository.create({
      userId: user.id,
      token: newRefreshToken,
      isRevoked: false,
    });

    return {
      user: tokenPayload,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken, userId) {
    if (refreshToken) {
      await refreshTokenRepository.revokeToken(refreshToken);
    } else if (userId) {
      await refreshTokenRepository.revokeAllForUser(userId);
    }
  }

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Return success to avoid email enumeration
      return { message: 'If an account exists with this email, a reset token has been generated.' };
    }
    const resetToken = uuidv4();
    await userRepository.update(user.id, {
      resetToken,
      resetTokenExpires: Date.now() + 60 * 60 * 1000, // 1 hour
    });
    return {
      message: 'If an account exists with this email, password reset instructions have been sent.',
    };
  }

  async resetPassword(token, newPassword) {
    const all = await userRepository.find({});
    const user = all.find((u) => u.resetToken === token && u.resetTokenExpires > Date.now());
    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
    }

    const hashedPassword = await hashPassword(newPassword);
    await userRepository.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpires: null,
    });
    // Invalidate existing sessions
    await refreshTokenRepository.revokeAllForUser(user.id);
    return { message: 'Password has been successfully reset. Please log in with your new password.' };
  }
}

export const authService = new AuthService();
