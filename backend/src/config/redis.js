import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

class InMemoryRedisMock {
  constructor() {
    this.store = new Map();
    this.sortedSets = new Map();
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, value, exType, ttl) {
    this.store.set(key, value);
    if (exType === 'EX' && ttl) {
      setTimeout(() => this.store.delete(key), ttl * 1000);
    }
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  async zadd(key, score, member) {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, new Map());
    }
    const set = this.sortedSets.get(key);
    set.set(member, Number(score));
    return 1;
  }

  async zrevrange(key, start, stop, withScores) {
    if (!this.sortedSets.has(key)) return [];
    const set = this.sortedSets.get(key);
    const sorted = Array.from(set.entries()).sort((a, b) => b[1] - a[1]);
    const sliced = sorted.slice(start, stop === -1 ? undefined : stop + 1);
    if (withScores === 'WITHSCORES') {
      const result = [];
      sliced.forEach(([member, score]) => {
        result.push(member, String(score));
      });
      return result;
    }
    return sliced.map(([member]) => member);
  }

  async zrevrank(key, member) {
    if (!this.sortedSets.has(key)) return null;
    const set = this.sortedSets.get(key);
    const sorted = Array.from(set.entries()).sort((a, b) => b[1] - a[1]);
    const index = sorted.findIndex(([m]) => m === member);
    return index >= 0 ? index : null;
  }

  async zscore(key, member) {
    if (!this.sortedSets.has(key)) return null;
    const score = this.sortedSets.get(key).get(member);
    return score !== undefined ? String(score) : null;
  }
}

let redisClient = null;
let isConnected = false;

export const connectRedis = () => {
  if (redisClient) return redisClient;

  try {
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy: () => null, // don't retry infinitely on dev if offline
    });

    client.on('connect', () => {
      isConnected = true;
      logger.info('Redis Connected successfully');
    });

    client.on('error', (err) => {
      if (!isConnected) {
        logger.warn(`Redis not reachable at ${env.REDIS_URL}. Using in-memory Redis mock.`);
        redisClient = new InMemoryRedisMock();
      }
    });

    redisClient = client;
    return redisClient;
  } catch (err) {
    logger.warn('Redis connection initialization failed. Using in-memory Redis mock.');
    redisClient = new InMemoryRedisMock();
    return redisClient;
  }
};

export const getRedis = () => {
  if (!redisClient) {
    return connectRedis();
  }
  return redisClient;
};
