import { Queue } from 'bullmq';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let submissionQueue = null;

class LocalQueueMock {
  constructor(name) {
    this.name = name;
    this.jobs = [];
    this.handler = null;
  }

  setHandler(fn) {
    this.handler = fn;
  }

  async add(name, data, opts) {
    const job = { id: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`, name, data };
    this.jobs.push(job);
    if (this.handler) {
      setTimeout(async () => {
        try {
          await this.handler(job);
        } catch (err) {
          logger.error('Local queue job failed', { error: err.message });
        }
      }, 50);
    }
    return job;
  }
}

export const getSubmissionQueue = () => {
  if (submissionQueue) return submissionQueue;

  try {
    submissionQueue = new Queue('submission-execution', {
      connection: {
        url: env.REDIS_URL,
        maxRetriesPerRequest: null,
      },
    });
    return submissionQueue;
  } catch (err) {
    logger.warn('Failed to connect BullMQ to Redis. Using in-process local queue fallback.');
    submissionQueue = new LocalQueueMock('submission-execution');
    return submissionQueue;
  }
};
