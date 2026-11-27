import { authService } from './auth.service.js';
import { getCookieOptions } from '../../utils/jwt.js';
import { successResponse } from '../../utils/response.js';
import { participantRepository } from '../participants/participants.repository.js';

export class AuthController {
  async login(req, res) {
    const { identifier, password } = req.body;
    const result = await authService.login(identifier, password);

    res.cookie('access_token', result.accessToken, getCookieOptions(false));
    res.cookie('refresh_token', result.refreshToken, getCookieOptions(true));

    return successResponse(res, {
      user: result.user,
      accessToken: result.accessToken,
      redirectPath: result.redirectPath,
      targetPortal: result.targetPortal,
    });
  }

  async refresh(req, res) {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    const result = await authService.refreshToken(refreshToken);

    res.cookie('access_token', result.accessToken, getCookieOptions(false));
    res.cookie('refresh_token', result.refreshToken, getCookieOptions(true));

    return successResponse(res, {
      user: result.user,
      accessToken: result.accessToken,
      redirectPath: result.redirectPath,
      targetPortal: result.targetPortal,
    });
  }

  async logout(req, res) {
    const refreshToken = req.cookies?.refresh_token;
    await authService.logout(refreshToken, req.user?.userId);

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

    return successResponse(res, { message: 'Logged out successfully' });
  }

  async getMe(req, res) {
    let user = { ...req.user };
    try {
      if (req.user?.userId || req.user?.email) {
        const participant =
          (await participantRepository.findById(req.user?.userId)) ||
          (await participantRepository.findByEmail(req.user?.email));
        if (participant) {
          user = {
            ...user,
            department: participant.department || 'Computer Science & Engineering',
            yearOrSemester: participant.yearOrSemester || '3rd Year / Semester 6',
            teamId: participant.teamId,
            rollNumber: participant.rollNumber || user.rollNumber,
          };
        }
      }
    } catch (e) {}
    return successResponse(res, { user });
  }

  async forgotPassword(req, res) {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return successResponse(res, result);
  }

  async resetPassword(req, res) {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    return successResponse(res, result);
  }
}

export const authController = new AuthController();
