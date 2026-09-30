import { ExecutionContext } from '@nestjs/common';
import { AgentSelfGuard } from './agent-self.guard.js';
import {
  ForbiddenError,
  UnauthorizedError,
} from '../../errors/app.exception.js';

describe('AgentSelfGuard', () => {
  const guard = new AgentSelfGuard();

  const createContext = (
    user: { id: number; role: string } | undefined,
    id: string,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params: { id } }),
      }),
    }) as unknown as ExecutionContext;

  it('allows an agent to read their own viewings', () => {
    expect(
      guard.canActivate(createContext({ id: 7, role: 'agent' }, '7')),
    ).toBe(true);
  });

  it('allows a moderator to read any agent viewings', () => {
    expect(
      guard.canActivate(createContext({ id: 1, role: 'moderator' }, '7')),
    ).toBe(true);
  });

  it('forbids an agent from reading another agent viewings', () => {
    expect(() =>
      guard.canActivate(createContext({ id: 8, role: 'agent' }, '7')),
    ).toThrow(ForbiddenError);
  });

  it('forbids a client', () => {
    expect(() =>
      guard.canActivate(createContext({ id: 7, role: 'client' }, '7')),
    ).toThrow(ForbiddenError);
  });

  it('leaves a non-numeric id to ParseIntPipe', () => {
    expect(
      guard.canActivate(createContext({ id: 7, role: 'agent' }, 'abc')),
    ).toBe(true);
  });

  it('rejects a request without a user', () => {
    expect(() => guard.canActivate(createContext(undefined, '7'))).toThrow(
      UnauthorizedError,
    );
  });
});
