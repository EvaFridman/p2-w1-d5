import { jest } from '@jest/globals';
import { ExecutionContext } from '@nestjs/common';
import { ListingOwnerGuard } from './listing-owner.guard.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ForbiddenError, NotFoundError } from '../../errors/app.exception.js';

describe('ListingOwnerGuard', () => {
  const findUnique = jest.fn<(...args: unknown[]) => Promise<unknown>>();
  const guard = new ListingOwnerGuard({
    listings: { findUnique },
  } as unknown as PrismaService);

  const createContext = (
    user: { id: number; role: string },
    id: string,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params: { id } }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => findUnique.mockReset());

  it('allows the listing owner', async () => {
    findUnique.mockResolvedValue({ agentId: 7 });
    await expect(
      guard.canActivate(createContext({ id: 7, role: 'agent' }, '3')),
    ).resolves.toBe(true);
  });

  it('allows a moderator without loading the listing', async () => {
    await expect(
      guard.canActivate(createContext({ id: 1, role: 'moderator' }, '3')),
    ).resolves.toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('forbids another agent', async () => {
    findUnique.mockResolvedValue({ agentId: 7 });
    await expect(
      guard.canActivate(createContext({ id: 8, role: 'agent' }, '3')),
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError for a missing listing', async () => {
    findUnique.mockResolvedValue(null);
    await expect(
      guard.canActivate(createContext({ id: 7, role: 'agent' }, '3')),
    ).rejects.toThrow(NotFoundError);
  });

  it('leaves a non-numeric id to ParseIntPipe', async () => {
    await expect(
      guard.canActivate(createContext({ id: 7, role: 'agent' }, 'abc')),
    ).resolves.toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
