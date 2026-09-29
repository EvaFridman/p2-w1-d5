import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class CacheService {
  private hits = 0;
  private misses = 0;

  constructor(
    @Inject('REDIS') private readonly redis: Redis,
    private readonly logger: PinoLogger,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);

      if (!cached) {
        this.misses++;
        return null;
      }

      this.hits++;

      try {
        return JSON.parse(cached) as T;
      } catch {
        this.misses++;
        return null;
      }
    } catch {
      this.misses++;
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    await this.redis.set(key, serializedValue, 'EX', ttlSeconds);
  }

  async setIfNotExists(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<boolean> {
    const serializedValue = JSON.stringify(value);
    const result = await this.redis.set(
      key,
      serializedValue,
      'EX',
      ttlSeconds,
      'NX',
    );
    return result === 'OK';
  }

  async addToTag(tag: string, key: string): Promise<void> {
    await this.redis.sadd(`tag:${tag}`, key);
  }

  async invalidateByTag(tag: string): Promise<void> {
    const tagKey = `tag:${tag}`;
    const keys = await this.redis.smembers(tagKey);
    if (keys.length > 0) await this.redis.unlink(...keys, tagKey);

    this.logger.info(
      {
        tag,
        invalidatedKeys: keys.length,
      },
      'Cache invalidated by tag',
    );
  }

  async acquireLock(key: string, ttlMs = 3000): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const result = await this.redis.set(lockKey, '1', 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.redis.unlink(`lock:${key}`);
  }

  async setPersistent(key: string, value: unknown): Promise<void> {
    const serializedValue = JSON.stringify(value);
    await this.redis.set(key, serializedValue);
  }

  async getPersistent<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
    };
  }

  isAvailable(): boolean {
    return this.redis.status === 'ready';
  }
}
