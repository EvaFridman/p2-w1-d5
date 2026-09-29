import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { AppSocket } from '../realtime.types.js';
import { UserRole } from '../../generated/prisma/index.js';
import { ForbiddenError } from '../../errors/app.exception.js';

@Injectable()
export class WsRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!roles) return true;

    const client = context.switchToWs().getClient<AppSocket>();
    const user = client.data?.user;

    if (!user || !roles.includes(user.role as UserRole)) {
      const errorInstance = new ForbiddenError();
      throw new WsException({
        message: errorInstance.message,
        details: null,
        code: 'FORBIDDEN',
      });
    }

    return true;
  }
}
