import { BaseRepository } from '../../utils/baseRepository.js';
import { PREDEFINED_SUB_ROLES, ALL_PERMISSIONS, SYSTEM_ROLES } from '@codeathon/shared';

class RoleRepository extends BaseRepository {
  constructor() {
    super('roles');
    this.seedDefaultRoles();
  }

  seedDefaultRoles() {
    // Super Admin Role
    this.create({
      id: SYSTEM_ROLES.SUPER_ADMIN,
      name: 'Super Admin',
      description: 'System owner with full unconstrained access',
      permissions: ALL_PERMISSIONS,
      isSystem: true,
    });

    // Admin Role
    this.create({
      id: SYSTEM_ROLES.ADMIN,
      name: 'Admin',
      description: 'Standard administrator with full operational privileges',
      permissions: ALL_PERMISSIONS.filter((p) => !p.endsWith('.revoke') && !p.startsWith('users_roles.')),
      isSystem: true,
    });

    // Student Role
    this.create({
      id: SYSTEM_ROLES.STUDENT,
      name: 'Student',
      description: 'Participant account for contests',
      permissions: [],
      isSystem: true,
    });

    // Seed predefined sub-roles
    PREDEFINED_SUB_ROLES.forEach((subRole) => {
      const id = subRole.name.toLowerCase().replace(/\s+/g, '_');
      this.create({
        id,
        name: subRole.name,
        description: subRole.description,
        permissions: subRole.permissions,
        isSystem: false,
      });
    });
  }
}

export const roleRepository = new RoleRepository();
