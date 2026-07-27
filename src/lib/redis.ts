import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';

const isMock =
  !redisUrl ||
  !redisToken ||
  redisUrl.includes('your-redis-instance') ||
  redisToken.includes('your-redis-token');

let redisClient: any;

if (isMock) {
  const store: Record<string, string> = {};

  redisClient = {
    get: async (key: string) => {
      const val = store[key];
      if (!val) return null;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    },
    set: async (key: string, value: any, options?: { ex?: number }) => {
      store[key] = JSON.stringify(value);
      return 'OK';
    },
    del: async (key: string) => {
      delete store[key];
      return 1;
    },
    flushall: async () => {
      for (const key in store) {
        delete store[key];
      }
      return 'OK';
    }
  };
} else {
  redisClient = new Redis({
    url: redisUrl,
    token: redisToken,
  });
}

export const redis = redisClient;
