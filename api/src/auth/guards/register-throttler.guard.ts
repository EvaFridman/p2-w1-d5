import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RegisterThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(options: any): Promise<boolean> {
    if (options.throttler.name !== 'register') return true;
    return super.handleRequest(options);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    return `${req.ip}:${req.body?.email ?? ''}`;
  }
}
