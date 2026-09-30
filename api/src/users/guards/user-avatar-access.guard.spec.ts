import { ExecutionContext } from '@nestjs/common';
import { UserAvatarAccessGuard } from './user-avatar-access.guard.js';
import { ForbiddenError } from '../../errors/app.exception.js';

describe('UserAvatarAccessGuard', () => {
  const guard = new UserAvatarAccessGuard();

  const createContext = (
    user: { id: number; role: string },
    id: string,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params: { id } }),
      }),
    }) as unknown as ExecutionContext;

  it('allows a user to manage their own avatar', async () => {
    await expect(
      guard.canActivate(createContext({ id: 7, role: 'agent' }, '7')),
    ).resolves.toBe(true);
  });

  it('allows a moderator to manage any avatar', async () => {
    await expect(
      guard.canActivate(createContext({ id: 1, role: 'moderator' }, '7')),
    ).resolves.toBe(true);
  });

  it('forbids managing another user avatar', async () => {
    await expect(
      guard.canActivate(createContext({ id: 8, role: 'agent' }, '7')),
    ).rejects.toThrow(ForbiddenError);
  });

  it('leaves a non-numeric id to ParseIntPipe', async () => {
    await expect(
      guard.canActivate(createContext({ id: 7, role: 'agent' }, 'abc')),
    ).resolves.toBe(true);
  });
});
