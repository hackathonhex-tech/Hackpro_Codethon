import { invitationLogRepository } from './invitationLog.repository.js';
import { contestRepository } from '../contests/contests.repository.js';
import { participantRepository } from '../participants/participants.repository.js';
import { assignmentRepository } from '../assignments/assignments.repository.js';
import { teamRepository } from '../teams/teams.repository.js';
import { auditRepository } from '../audit/audit.repository.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';

export class InvitationsService {
  /**
   * Generate an improvised, high-impact, bulletproof HTML email for candidate contest invitations.
   * Uses 100% inline CSS and table layout for full compatibility across Gmail, Outlook, Apple Mail, and mobile clients.
   */
  generateInvitationHtml({ candidateName, email, batchCode, contestTitle, portalUrl, durationMinutes }) {
    const cleanName = candidateName || 'Candidate';
    const cleanContest = contestTitle || 'Technical Assessment';
    const cleanBatch = batchCode || '—';
    const cleanUrl = portalUrl || env.STUDENT_PORTAL_URL;
    const cleanDuration = Number(durationMinutes) || 60;
    const year = new Date().getFullYear();

    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Assessment Invitation - HACKPRO</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F1F5F9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background: #0B132B; background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%); padding: 36px 32px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background-color: #3760F8; color: #FFFFFF; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 5px 14px; border-radius: 9999px; margin-bottom: 12px;">
                      HACKPRO ASSESSMENT SYSTEM
                    </span>
                    <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 6px 0; line-height: 1.2;">
                      Assessment Invitation &amp; Access Pass
                    </h1>
                    <p style="color: #94A3B8; font-size: 13px; margin: 0; font-weight: 500;">
                      Candidate Examination &amp; Evaluation Portal
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 36px 32px;">
              <!-- Personalized Greeting -->
              <p style="font-size: 18px; font-weight: 700; color: #0F172A; margin: 0 0 10px 0;">
                Dear ${cleanName},
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                You have been officially enrolled to participate in <strong>${cleanContest}</strong>. Please review your assessment details and credentials below to access the examination portal.
              </p>

              <!-- Examination Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
                <tr>
                  <td style="padding: 18px 20px; border-bottom: 1px solid #EDF2F7;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="38%" style="font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Assessment Title:</td>
                        <td style="font-size: 14px; font-weight: 700; color: #0F172A;">${cleanContest}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #EDF2F7;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="38%" style="font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Allocated Duration:</td>
                        <td style="font-size: 13px; font-weight: 700; color: #0F172A;">
                          <span style="display: inline-block; background-color: #EEF2FF; color: #4338CA; padding: 2px 8px; border-radius: 6px; font-weight: 700;">
                            ⏱️ ${cleanDuration} Minutes
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="38%" style="font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Registered Email:</td>
                        <td style="font-size: 13px; font-weight: 700; color: #0F172A; font-family: monospace;">${email}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Unique Contest Batch Code Highlight Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #EEF2FF; border: 2px dashed #6366F1; border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td align="center" style="padding: 22px 20px;">
                    <span style="font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 1.5px; color: #4338CA; display: block; margin-bottom: 6px;">
                      YOUR OFFICIAL CONTEST BATCH CODE
                    </span>
                    <span style="font-size: 28px; font-weight: 900; letter-spacing: 3px; color: #3760F8; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; display: block; margin-bottom: 6px;">
                      ${cleanBatch}
                    </span>
                    <span style="font-size: 12px; color: #6366F1; font-weight: 500;">
                      (Keep this code ready — required during candidate sign-in)
                    </span>
                  </td>
                </tr>
              </table>

              <!-- 5-Step Login Instructions -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; margin-bottom: 24px; padding: 22px 20px;">
                <tr>
                  <td>
                    <h3 style="font-size: 14px; font-weight: 800; color: #0F172A; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                      Participant Login Instructions (5 Steps)
                    </h3>

                    <!-- Step 1 -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td width="28" valign="top">
                          <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background-color: #3760F8; color: #FFFFFF; font-weight: 700; font-size: 11px;">1</span>
                        </td>
                        <td style="font-size: 13px; color: #334155; line-height: 1.5;">
                          Open the official examination portal in your web browser: <a href="https://contest.hackpro.in/login" style="color: #3760F8; text-decoration: underline; font-weight: 600;" target="_blank">https://contest.hackpro.in/login</a>
                        </td>
                      </tr>
                    </table>

                    <!-- Step 2 -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td width="28" valign="top">
                          <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background-color: #3760F8; color: #FFFFFF; font-weight: 700; font-size: 11px;">2</span>
                        </td>
                        <td style="font-size: 13px; color: #334155; line-height: 1.5;">
                          Enter your registered email ID: <strong style="color: #0F172A; font-family: monospace;">${email}</strong>
                        </td>
                      </tr>
                    </table>

                    <!-- Step 3 -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td width="28" valign="top">
                          <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background-color: #3760F8; color: #FFFFFF; font-weight: 700; font-size: 11px;">3</span>
                        </td>
                        <td style="font-size: 13px; color: #334155; line-height: 1.5;">
                          Enter your assigned contest batch code: <strong style="color: #3760F8; font-family: monospace; letter-spacing: 1px;">${cleanBatch}</strong>
                        </td>
                      </tr>
                    </table>

                    <!-- Step 4 -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                      <tr>
                        <td width="28" valign="top">
                          <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background-color: #3760F8; color: #FFFFFF; font-weight: 700; font-size: 11px;">4</span>
                        </td>
                        <td style="font-size: 13px; color: #334155; line-height: 1.5;">
                          The system securely verifies your identity and loads your personalized examination session.
                        </td>
                      </tr>
                    </table>

                    <!-- Step 5 -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="28" valign="top">
                          <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background-color: #3760F8; color: #FFFFFF; font-weight: 700; font-size: 11px;">5</span>
                        </td>
                        <td style="font-size: 13px; color: #334155; line-height: 1.5;">
                          Assessment access unlocks dynamically as soon as the contest is activated by schedule or administrator.
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Technical & Proctoring Requirements Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; border-left: 4px solid #3760F8; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; color: #475569; line-height: 1.6;">
                    <strong style="color: #0F172A; display: block; margin-bottom: 4px;">Important System &amp; Proctoring Guidelines:</strong>
                    &bull; <strong>Recommended Browsers:</strong> Google Chrome or Microsoft Edge (latest versions).<br />
                    &bull; <strong>Hardware Requirements:</strong> A functional desktop/laptop with a stable broadband internet connection.<br />
                    &bull; <strong>Proctoring Notice:</strong> If proctoring is enabled, grant camera and microphone permissions and avoid switching tabs or minimizing the browser window during the test.
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #94A3B8; line-height: 1.5; margin: 0;">
                If you encounter any issues during authentication, please reach out immediately to your examination coordinator or reply to this notice.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 32px; text-align: center;">
              <p style="font-size: 12px; font-weight: 600; color: #64748B; margin: 0 0 6px 0;">
                &copy; ${year} HACKPRO Assessment Platform. All rights reserved.
              </p>
              <p style="font-size: 11px; color: #94A3B8; margin: 0; line-height: 1.4;">
                This automated invitation was sent to <strong style="color: #64748B;">${email}</strong>.<br />
                Do not share your unique batch code or access credentials with unauthorized persons.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Send single invitation via Brevo SMTP API
   */
  async sendSingleEmail({ toEmail, toName, batchCode, contestTitle, portalUrl, durationMinutes }) {
    const apiKey = env.BREVO_API_KEY;
    const senderEmail = env.BREVO_SENDER_EMAIL;

    if (!apiKey || !senderEmail) {
      throw ApiError.badRequest('Email service is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL in backend/.env.');
    }

    const htmlContent = this.generateInvitationHtml({
      candidateName: toName,
      email: toEmail,
      batchCode,
      contestTitle,
      portalUrl,
      durationMinutes,
    });

    const payload = {
      sender: {
        name: 'HACKPRO Assessment',
        email: senderEmail,
      },
      to: [
        {
          email: toEmail,
          name: toName || 'Candidate',
        },
      ],
      subject: `[Invitation] Assessment Access: ${contestTitle} (Batch: ${batchCode})`,
      htmlContent,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resJson = await response.json();

    if (!response.ok) {
      throw new Error(resJson.message || `Brevo API error (${response.status})`);
    }

    return resJson.messageId || 'msg_' + Date.now();
  }

  /**
   * Get all participants assigned to a contest with their live invitation status
   */
  async getContestParticipantsWithInvitationStatus(contestId) {
    const contest = await contestRepository.findById(contestId);
    if (!contest) throw ApiError.notFound('Contest not found');

    const assignments = await assignmentRepository.findByContest(contestId);
    const allParticipants = await participantRepository.find({});
    const allTeams = await teamRepository.find({});
    const logs = await invitationLogRepository.findByContest(contestId);

    // Identify all assigned participant IDs
    const assignedParticipantIds = new Set();
    const teamMap = new Map();
    allTeams.forEach((t) => teamMap.set(t.id || t._id, t));

    for (const a of assignments) {
      if (a.participantId) {
        assignedParticipantIds.add(String(a.participantId));
      }
      if (a.teamId) {
        const team = teamMap.get(a.teamId);
        if (team && Array.isArray(team.memberIds)) {
          team.memberIds.forEach((mId) => assignedParticipantIds.add(String(mId)));
        }
      }
    }

    const logMap = new Map();
    logs.forEach((log) => {
      const pid = String(log.participantId);
      logMap.set(pid, log);
    });

    // If no direct assignments exist, include all participants matching batch code
    let targetParticipants = allParticipants.filter((p) => {
      const pid = String(p.id || p.userId || p._id);
      return assignedParticipantIds.has(pid);
    });

    if (targetParticipants.length === 0 && contest.batchCode) {
      targetParticipants = allParticipants;
    }

    const list = targetParticipants.map((p) => {
      const pid = String(p.id || p.userId || p._id);
      const log = logMap.get(pid);

      return {
        participantId: pid,
        name: p.name || 'Candidate',
        email: p.email,
        rollNumber: p.rollNumber || '—',
        department: p.department || '—',
        college: p.college || '—',
        batchCode: contest.batchCode || '—',
        invitationStatus: log?.status || 'pending', // 'pending' | 'delivered' | 'failed'
        lastSentAt: log?.sentAt || null,
        errorMsg: log?.errorMsg || null,
      };
    });

    const total = list.length;
    const delivered = list.filter((item) => item.invitationStatus === 'delivered').length;
    const failed = list.filter((item) => item.invitationStatus === 'failed').length;
    const pending = total - delivered - failed;

    return {
      contest: {
        id: contest.id,
        title: contest.title,
        batchCode: contest.batchCode,
        durationMinutes: contest.durationMinutes,
        portalUrl: env.STUDENT_PORTAL_URL,
      },
      stats: {
        total,
        delivered,
        pending,
        failed,
      },
      participants: list,
    };
  }

  /**
   * Send invitations to all or selected participants for a contest
   */
  async sendInvitations(contestId, user, { participantIds = null } = {}) {
    const contest = await contestRepository.findById(contestId);
    if (!contest) throw ApiError.notFound('Contest not found');

    const data = await this.getContestParticipantsWithInvitationStatus(contestId);
    let targets = data.participants;

    if (participantIds && Array.isArray(participantIds) && participantIds.length > 0) {
      const idSet = new Set(participantIds.map(String));
      targets = targets.filter((p) => idSet.has(String(p.participantId)));
    }

    if (targets.length === 0) {
      throw ApiError.badRequest('No eligible participants found to send invitations.');
    }

    const portalUrl = env.STUDENT_PORTAL_URL;
    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const p of targets) {
      try {
        const messageId = await this.sendSingleEmail({
          toEmail: p.email,
          toName: p.name,
          batchCode: contest.batchCode || '—',
          contestTitle: contest.title,
          portalUrl,
          durationMinutes: contest.durationMinutes,
        });

        await invitationLogRepository.upsertLog(contestId, p.participantId, {
          email: p.email,
          name: p.name,
          rollNumber: p.rollNumber,
          batchCode: contest.batchCode || '—',
          status: 'delivered',
          messageId,
          errorMsg: null,
          sentAt: new Date().toISOString(),
        });

        successCount++;
        results.push({ participantId: p.participantId, email: p.email, status: 'delivered', messageId });
      } catch (err) {
        logger.error(`Failed to send invitation to ${p.email}:`, err);
        const errorMsg = err.message || 'Unknown delivery failure';

        await invitationLogRepository.upsertLog(contestId, p.participantId, {
          email: p.email,
          name: p.name,
          rollNumber: p.rollNumber,
          batchCode: contest.batchCode || '—',
          status: 'failed',
          messageId: null,
          errorMsg,
          sentAt: new Date().toISOString(),
        });

        failCount++;
        results.push({ participantId: p.participantId, email: p.email, status: 'failed', error: errorMsg });
      }
    }

    // Log action to audit logs
    try {
      await auditRepository.create({
        userId: user?.userId || 'admin',
        userName: user?.name || 'Administrator',
        action: 'invitations.sent',
        resource: 'contest_invitations',
        resourceId: contestId,
        metadata: {
          total: targets.length,
          successful: successCount,
          failed: failCount,
        },
      });
    } catch (auditErr) {
      logger.warn(`Failed to record audit log for invitations: ${auditErr.message}`);
    }

    return {
      total: targets.length,
      successful: successCount,
      failed: failCount,
      results,
    };
  }

  /**
   * Resend failed invitations for a contest
   */
  async resendFailedInvitations(contestId, user) {
    const data = await this.getContestParticipantsWithInvitationStatus(contestId);
    const failedParticipants = data.participants.filter((p) => p.invitationStatus === 'failed');

    if (failedParticipants.length === 0) {
      return { total: 0, successful: 0, failed: 0, message: 'No failed invitations to resend.' };
    }

    const failedIds = failedParticipants.map((p) => p.participantId);
    return this.sendInvitations(contestId, user, { participantIds: failedIds });
  }
}

export const invitationsService = new InvitationsService();
