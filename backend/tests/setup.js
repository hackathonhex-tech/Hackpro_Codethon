import { seedSuperAdmin } from '../scripts/seed-super-admin.js';
import { seedRubrics } from '../scripts/seed-rubrics.js';
import { seedSampleContest } from '../scripts/seed-sample-contest.js';

export const setupTestDatabase = async () => {
  await seedSuperAdmin();
  await seedRubrics();
  await seedSampleContest();
};
