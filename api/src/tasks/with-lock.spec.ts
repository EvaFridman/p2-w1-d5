import { jest } from '@jest/globals';
import { PinoLogger } from 'nestjs-pino';
import { withLock } from './with-lock.js';
import { CacheService } from '../redis/cache.service.js';

describe('withLock', () => {
    it('does not execute task when lock is busy', async () => {
        const acquireLock = jest.fn<(key: string, ttlMs: number) => Promise<boolean>>();
        const releaseLock = jest.fn<(key: string) => Promise<void>>();
        const setPersistent = jest.fn<(key: string, value: unknown) => Promise<void>>();

        acquireLock.mockResolvedValue(false);
        releaseLock.mockResolvedValue(undefined);
        setPersistent.mockResolvedValue(undefined);

        const cacheService = {
            acquireLock,
            releaseLock,
            setPersistent,
        } as unknown as CacheService;

        const logger = {
            info: jest.fn(),
            error: jest.fn(),
        } as unknown as PinoLogger;

        const task = jest.fn<() => Promise<number>>();
        task.mockResolvedValue(1);

        const result = await withLock('test-task', cacheService, task, logger);

        expect(result).toBeUndefined();
        expect(task).not.toHaveBeenCalled();
        expect(acquireLock).toHaveBeenCalledWith('task:test-task', 5 * 60 * 1000);
        expect(releaseLock).not.toHaveBeenCalled();
    });
});