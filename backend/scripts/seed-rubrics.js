import { rubricRepository } from '../src/modules/rubrics/rubrics.repository.js';
import { logger } from '../src/utils/logger.js';

export const seedRubrics = async () => {
  const rubrics = await rubricRepository.find({});
  logger.info(`Seeded ${rubrics.length} rubrics ready for evaluation.`);
  return rubrics;
};

if (process.argv[1]?.endsWith('seed-rubrics.js')) {
  seedRubrics().then(() => process.exit(0));
}
