import { ApiError } from '../utils/ApiError.js';
import { SYSTEM_ROLES } from '@codeathon/shared';
import { roleRepository } from '../modules/roles/roles.repository.js';
import { userRepository } from '../modules/users/users.repository.js';

export const requirePermission = (permissionKey, sensitiveRecheck = false) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return next(ApiError.unauthorized('Authentication required'));
      }

      const roleStr = String(user.role || '').toLowerCase();
      const roleNameStr = String(user.roleName || '').toLowerCase();
      const emailStr = String(user.email || '').toLowerCase();

      // Super Admin bypass all checks
      if (
        roleStr === 'super_admin' ||
        roleStr === 'superadmin' ||
        user.isSuperAdmin === true ||
        roleNameStr.includes('super')
      ) {
        return next();
      }

      // Standard Admin has full operational privileges
      const isStandardAdmin =
        roleStr === 'admin' ||
        roleNameStr === 'admin' ||
        roleNameStr === 'administrator';

      const SUPER_ADMIN_ONLY_PERMS = [
        'submissions.revoke',
        'users_roles.create',
        'users_roles.update',
        'users_roles.delete',
      ];

      if (isStandardAdmin && !SUPER_ADMIN_ONLY_PERMS.includes(permissionKey)) {
        return next();
      }

      let permissions = Array.isArray(user.permissions) ? user.permissions : [];

      // If sensitive recheck or empty permissions, query the fresh user and role from database
      if (sensitiveRecheck || permissions.length === 0) {
        const freshUser = await userRepository.findById(user.userId || user.id);
        if (freshUser) {
          if (!freshUser.isActive) {
            return next(ApiError.unauthorized('Account deactivated or deleted'));
          }
          const freshRoleStr = String(freshUser.role || '').toLowerCase();
          if (
            freshRoleStr === 'super_admin' ||
            freshRoleStr === 'superadmin' ||
            freshUser.isSuperAdmin
          ) {
            return next();
          }
          if (
            freshRoleStr === 'admin' &&
            !SUPER_ADMIN_ONLY_PERMS.includes(permissionKey)
          ) {
            return next();
          }
          const freshRole = await roleRepository.findById(freshUser.roleId || freshUser.role);
          if (freshRole && Array.isArray(freshRole.permissions)) {
            permissions = freshRole.permissions;
          }
        }
      }

      if (permissions.includes(permissionKey)) {
        return next();
      }

      return next(
        ApiError.forbidden(
          `Access denied. You do not have permission to perform this action (${permissionKey}).`,
          'PERMISSION_DENIED',
          { requiredPermission: permissionKey }
        )
      );
    } catch (err) {
      next(err);
    }
  };
};

export const requireSuperAdmin = () => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    const roleStr = String(user.role || '').toLowerCase();
    const roleNameStr = String(user.roleName || '').toLowerCase();
    if (
      roleStr === 'super_admin' ||
      roleStr === 'superadmin' ||
      user.isSuperAdmin === true ||
      roleNameStr === 'super admin' ||
      roleNameStr === 'super_admin'
    ) {
      return next();
    }
    return next(ApiError.forbidden('Super Admin privilege required', 'SUPER_ADMIN_REQUIRED'));
  };
};
