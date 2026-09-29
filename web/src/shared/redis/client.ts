import "server-only";
import { Redis } from "ioredis";

declare global {
  var redisClient: Redis | undefined;
}

if (!globalThis.redisClient) {
  globalThis.redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT) || 6379,
    db: 1,
  });
}

export const redis = globalThis.redisClient;
