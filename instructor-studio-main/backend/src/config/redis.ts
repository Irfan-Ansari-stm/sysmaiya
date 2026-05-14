import Redis from 'ioredis';
import { logger } from '../utils/logger';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  lazyConnect: true,
});

redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { error: err.message }));
redis.on('reconnecting', () => logger.warn('Redis reconnecting...'));

export async function testRedisConnection(): Promise<void> {
  await redis.connect();
  await redis.ping();
}

// Typed cache helpers
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const val = await redis.get(key);
    if (!val) return null;
    try { return JSON.parse(val) as T; } catch { return val as unknown as T; }
  },
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) await redis.setex(key, ttlSeconds, serialized);
    else await redis.set(key, serialized);
  },
  async del(key: string): Promise<void> { await redis.del(key); },
  async exists(key: string): Promise<boolean> { return (await redis.exists(key)) === 1; },
  async incr(key: string): Promise<number> { return redis.incr(key); },
  async expire(key: string, ttl: number): Promise<void> { await redis.expire(key, ttl); },
  async keys(pattern: string): Promise<string[]> { return redis.keys(pattern); },
  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  },
};

// Cache key factories
export const CacheKeys = {
  userSession: (userId: string) => `session:${userId}`,
  rateLimitLogin: (ip: string) => `rl:login:${ip}`,
  courseList: (params: string) => `courses:list:${params}`,
  courseDetail: (slug: string) => `course:${slug}`,
  userRoles: (userId: string) => `user:roles:${userId}`,
  resetToken: (token: string) => `reset:${token}`,
  emailVerify: (token: string) => `verify:${token}`,
  blacklistedToken: (jti: string) => `blacklist:${jti}`,
};

export default redis;
