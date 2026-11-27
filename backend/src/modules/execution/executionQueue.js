import os from 'os';
import { env } from '../../config/env.js';

export class ExecutionQueue {
  constructor(
    concurrency = env.EXECUTION_CONCURRENCY || 2, // Throttled to 2 parallel tasks to protect Railway Hobby RAM and prevent OOM
    maxQueueSize = env.EXECUTION_MAX_QUEUE || 2000 // Accommodates large 700+ student batches in queue without drops
  ) {
    this.concurrency = concurrency;
    this.maxQueueSize = maxQueueSize;
    this.activeWorkers = 0;
    this.queue = [];
  }

  async enqueue(taskFn) {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error(`Execution queue saturated (${this.maxQueueSize} pending tasks). Please retry in a few seconds.`);
    }
    return new Promise((resolve, reject) => {
      this.queue.push({ taskFn, resolve, reject });
      this.processNext();
    });
  }

  processNext() {
    if (this.activeWorkers >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const { taskFn, resolve, reject } = this.queue.shift();
    this.activeWorkers++;

    (async () => {
      try {
        const result = await taskFn();
        resolve(result);
      } catch (err) {
        reject(err);
      } finally {
        this.activeWorkers--;
        this.processNext();
      }
    })();
  }

  getStats() {
    return {
      activeWorkers: this.activeWorkers,
      queuedTasks: this.queue.length,
      concurrencyLimit: this.concurrency,
      maxQueueSize: this.maxQueueSize,
    };
  }
}

export const executionQueue = new ExecutionQueue();
