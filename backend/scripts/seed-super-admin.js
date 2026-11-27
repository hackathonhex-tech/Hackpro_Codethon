import { userRepository } from '../src/modules/users/users.repository.js';
import { hashPassword } from '../src/utils/password.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/utils/logger.js';
import { SYSTEM_ROLES } from '@codeathon/shared';

export const seedSuperAdmin = async () => {
  try {
    if (!env.SUPER_ADMIN_EMAIL || !env.SUPER_ADMIN_PASSWORD) {
      logger.warn('SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env; skipping Super Admin seed.');
      return null;
    }

    let superAdmin = await userRepository.findByEmail(env.SUPER_ADMIN_EMAIL);
    if (!superAdmin) {
      const hashedPassword = await hashPassword(env.SUPER_ADMIN_PASSWORD);
      superAdmin = await userRepository.create({
        id: 'super_admin_user',
        name: 'Super Admin',
        email: env.SUPER_ADMIN_EMAIL.toLowerCase(),
        password: hashedPassword,
        role: SYSTEM_ROLES.SUPER_ADMIN,
        roleId: SYSTEM_ROLES.SUPER_ADMIN,
        roleName: 'Super Admin',
        contestScope: [],
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      logger.info(`Super Admin seeded successfully: ${env.SUPER_ADMIN_EMAIL}`);
    }

    // Seed standard Administrator account if configured in .env
    if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
      const existingAdmin = await userRepository.findByEmail(env.ADMIN_EMAIL);
      if (!existingAdmin) {
        const hashedAdminPassword = await hashPassword(env.ADMIN_PASSWORD);
        await userRepository.create({
          id: 'admin_user',
          name: 'Administrator',
          email: env.ADMIN_EMAIL.toLowerCase(),
          password: hashedAdminPassword,
          role: SYSTEM_ROLES.ADMIN,
          roleId: SYSTEM_ROLES.ADMIN,
          roleName: 'Admin',
          contestScope: [],
          isActive: true,
          createdAt: new Date().toISOString(),
        });
        logger.info(`Standard Administrator seeded successfully: ${env.ADMIN_EMAIL}`);
      }
    }

    return superAdmin;
  } catch (err) {
    logger.error('Failed to seed Super Admin', { error: err.message });
  }
};

if (process.argv[1]?.endsWith('seed-super-admin.js')) {
  seedSuperAdmin().then(() => process.exit(0));
}
