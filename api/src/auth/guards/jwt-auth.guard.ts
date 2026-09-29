import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { UnauthorizedError } from '../../errors/app.exception.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'ws') return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(
      'optionalAuth',
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');

    if (isOptionalAuth && (!scheme || scheme !== 'Bearer' || !token))
      return true;
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedError('No token');

    try {
      const secret = this.config.get<string>('JWT_ACCESS_SECRET');
      const payload = await this.jwt.verifyAsync(token, { secret });
      request.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      if (isOptionalAuth) return true;
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}
