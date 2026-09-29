import { jest } from '@jest/globals';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { ForbiddenError } from '../../errors/app.exception.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (
    userRole?: string,
    routeRoles?: string[],
  ): ExecutionContext => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(routeRoles);

    const mockRequest = {
      user: userRole ? { id: 1, role: userRole } : undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  it('should return true if no roles are required on the route', async () => {
    const context = createMockContext('agent', undefined);
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenError if user does not have the required role', async () => {
    const context = createMockContext('agent', ['moderator']);
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenError);
  });

  it('should return true if user role matches the role required for route', async () => {
    const context = createMockContext('moderator', ['moderator']);
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
