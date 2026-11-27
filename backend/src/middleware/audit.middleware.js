import { auditRepository } from '../modules/audit/audit.repository.js';
import { logger } from '../utils/logger.js';

export const logAudit = (action, getDetails) => {
  return async (req, res, next) => {
    // Execute the action first
    const originalJson = res.json.bind(res);
    res.json = async function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const user = req.user;
          const details = typeof getDetails === 'function' ? getDetails(req, body) : getDetails || {};
          await auditRepository.create({
            userId: user?.userId || 'system',
            userName: user?.name || 'System',
            action,
            details,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'] || '',
            createdAt: new Date().toISOString(),
          });
        } catch (auditErr) {
          logger.error('Failed to write audit log', { error: auditErr.message });
        }
      }
      return originalJson(body);
    };
    next();
  };
};
