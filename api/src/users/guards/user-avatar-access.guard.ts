import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/index.js';
import { ForbiddenError } from '../../errors/app.exception.js';

@Injectable()
export class UserAvatarAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetUserId = parseInt(request.params.id, 10);
    if (isNaN(targetUserId)) return false;
    if (user.role === UserRole.moderator || user.id === targetUserId)
      return true;

    throw new ForbiddenError(
      'You can only manage your own avatar',
      null,
      'FORBIDDEN',
    );
  }
}
