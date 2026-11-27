import { seedSuperAdmin } from './seed-super-admin.js';
import { seedRubrics } from './seed-rubrics.js';
import { seedSampleContest } from './seed-sample-contest.js';
import { logger } from '../src/utils/logger.js';

const seedAll = async () => {
  logger.info('--- Starting Codeathon Platform Database Seeding ---');
  await seedSuperAdmin();
  await seedRubrics();
  await seedSampleContest();
  logger.info('--- All Seeds Completed Successfully! ---');
  process.exit(0);
};

seedAll();
