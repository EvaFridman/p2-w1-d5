import "server-only";

import { redis } from "@/shared/redis/client";
import type { AuthUser } from "./types";

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  userId: number;
};

const SESSION_TTL = 60 * 60 * 24 * 30;

function getSessionKey(id: string) {
  return `session:${id}`;
}

function getUserSessionsKey(userId: number) {
  return `user-sessions:${userId}`;
}

export const sessions = {
  async create(session: Session): Promise<string> {
    const id = crypto.randomUUID();
    const key = getSessionKey(id);

    await redis.hset(key, {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      userId: String(session.user.id),
    });

    await redis.expire(key, SESSION_TTL);
    await redis.sadd(getUserSessionsKey(session.user.id), id);
    await redis.expire(getUserSessionsKey(session.user.id), SESSION_TTL);

    return id;
  },

  async get(id: string): Promise<StoredSession | null> {
    const data = await redis.hgetall(getSessionKey(id));
    if (!Object.keys(data).length) return null;
    await redis.expire(getSessionKey(id), SESSION_TTL);

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      userId: Number(data.userId),
    };
  },

  async update(id: string, patch: Partial<Session>): Promise<boolean> {
    const key = getSessionKey(id);
    const data = await redis.hgetall(key);
    if (!Object.keys(data).length) return false;
    const fields: Record<string, string> = {};

    if (patch.accessToken !== undefined) fields.accessToken = patch.accessToken;
    if (patch.refreshToken !== undefined) fields.refreshToken = patch.refreshToken;
    if (patch.user !== undefined) fields.userId = String(patch.user.id);

    if (Object.keys(fields).length) await redis.hset(key, fields);

    await redis.expire(key, SESSION_TTL);

    return true;
  },

  async destroy(id: string): Promise<boolean> {
    const key = getSessionKey(id);
    const data = await redis.hgetall(key);

    if (!Object.keys(data).length) return false;

    await redis.unlink(key);
    await redis.srem(getUserSessionsKey(Number(data.userId)), id);

    return true;
  },
};

export async function destroyAllSessions(userId: number): Promise<void> {
  const userSessionsKey = getUserSessionsKey(userId);
  const sessionIds = await redis.smembers(userSessionsKey);
  const sessionKeys = sessionIds.map((id) => getSessionKey(id));
  await redis.unlink(userSessionsKey, ...sessionKeys);
}
