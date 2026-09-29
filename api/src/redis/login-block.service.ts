import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

const BLOCK_TTL = 15 * 60;

@Injectable()
export class LoginBlockService {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  async getBlockTtl(email: string): Promise<number> {
    return this.redis.ttl(`block:login:${email}`);
  }

  async recordFailure(email: string): Promise<void> {
    const key = `fail:login:${email}`;
    const failures = await this.redis.incr(key);
    if (failures === 1) await this.redis.expire(key, BLOCK_TTL);
    if (failures >= 5)
      await this.redis.set(`block:login:${email}`, '1', 'EX', BLOCK_TTL);
  }

  async clearFailures(email: string): Promise<void> {
    await this.redis.unlink(`fail:login:${email}`);
  }
}
