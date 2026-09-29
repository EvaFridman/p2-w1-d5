import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class PublicViewingRateLimitService {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  async check(
    ip: string,
    limit: number,
    windowMs: number,
  ): Promise<{ allowed: boolean; totalHits: number }> {
    const key = `throttler:viewingPublic:${ip}`;
    const now = Date.now();
    const minTime = now - windowMs;
    const member = `${now}-${crypto.randomUUID()}`;
    await this.redis.zremrangebyscore(key, 0, minTime);
    await this.redis.zadd(key, now, member);
    const totalHits = await this.redis.zcard(key);
    await this.redis.expire(key, windowMs / 1000);

    if (totalHits > limit) {
      await this.redis.zrem(key, member);
      return { allowed: false, totalHits: totalHits - 1 };
    }

    return { allowed: true, totalHits };
  }
}
