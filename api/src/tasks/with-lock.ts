import { PinoLogger } from 'nestjs-pino';
import { CacheService } from '../redis/cache.service.js';

const TASK_LOCK_TTL = 5 * 60 * 1000;

export async function withLock<T>(
  name: string,
  cacheService: CacheService,
  task: () => Promise<T>,
  logger: PinoLogger,
): Promise<T | undefined> {
  const startedAt = Date.now();
  const key = `task:${name}`;
  const acquired = await cacheService.acquireLock(key, TASK_LOCK_TTL);

  if (!acquired) {
    logger.info(
      { task: name, result: 'skipped', reason: 'lock-busy' },
      'Task skipped',
    );
    return undefined;
  }

  try {
    const result = await task();
    const durationMs = Date.now() - startedAt;
    const processed =
      typeof result === 'number'
        ? result
        : typeof result === 'object' && result !== null && 'processed' in result
          ? Number(result.processed)
          : 0;
    const errors =
      typeof result === 'object' && result !== null && 'errors' in result
        ? Number(result.errors)
        : 0;
    await cacheService.setPersistent(
      `task:last-success:${name}`,
      new Date().toISOString(),
    );

    logger.info(
      {
        task: name,
        durationMs,
        result: 'success',
        processed,
        errors,
      },
      'Task completed',
    );

    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    logger.error(
      {
        task: name,
        durationMs,
        result: 'error',
        err: error,
      },
      'Task failed',
    );

    return undefined;
  } finally {
    await cacheService.releaseLock(key);
  }
}
