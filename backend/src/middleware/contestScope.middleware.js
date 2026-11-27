import { ApiError } from '../utils/ApiError.js';
import { SYSTEM_ROLES } from '@codeathon/shared';

export const checkContestScope = (paramName = 'contestId') => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return next(ApiError.unauthorized('Authentication required'));

    if (user.role === SYSTEM_ROLES.SUPER_ADMIN || user.isSuperAdmin) {
      return next();
    }

    const contestScope = user.contestScope || [];
    // If empty scope, user has global access across contests within their permissions
    if (contestScope.length === 0) {
      return next();
    }

    const targetContestId = req.params[paramName] || req.body[paramName] || req.query[paramName];
    if (targetContestId && !contestScope.includes(targetContestId)) {
      return next(
        ApiError.forbidden(
          'Your account role is restricted from accessing this contest.',
          'CONTEST_SCOPE_RESTRICTED',
          { allowedContests: contestScope }
        )
      );
    }

    next();
  };
};
