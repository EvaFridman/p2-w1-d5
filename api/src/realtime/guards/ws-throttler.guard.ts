import { Injectable, Inject, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  @Inject(PinoLogger)
  private readonly logger: PinoLogger;

  protected async handleRequest(options: ThrottlerRequest): Promise<boolean> {
    const { context, limit, ttl, throttler, blockDuration } = options;
    const socket = context.switchToWs().getClient<Socket>();

    const tracker = socket.id;
    const key = this.generateKey(context, tracker, throttler.name ?? '');

    const { totalHits } = await this.storageService.increment(
      key,
      ttl,
      limit,
      blockDuration,
      throttler.name ?? '',
    );
    if (totalHits > limit) await this.throwThrottlerException(context);
    return true;
  }

  protected async throwThrottlerException(
    context: ExecutionContext,
  ): Promise<void> {
    const socket = context.switchToWs().getClient<Socket>();
    this.logger.warn({ socketId: socket.id }, 'Socket rate limit exceeded');
    socket.disconnect(true);
    throw new WsException('Rate limit exceeded');
  }
}
