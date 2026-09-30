import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/index.js';
import {
  ForbiddenError,
  UnauthorizedError,
} from '../../errors/app.exception.js';

@Injectable()
export class AgentSelfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new UnauthorizedError();

    const agentId = parseInt(request.params.id, 10);
    // ParseIntPipe rejects a non-numeric id with 400 after the guard runs.
    if (isNaN(agentId)) return true;
    if (user.role === UserRole.moderator) return true;
    if (user.role === UserRole.agent && user.id === agentId) return true;

    throw new ForbiddenError(
      'You can only view your own viewings',
      null,
      'FORBIDDEN',
    );
  }
}
