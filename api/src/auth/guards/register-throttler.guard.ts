import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { Request } from "express";

@Injectable()
export class RegisterThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    if (requestProps.throttler.name !== "register") return true;
    return super.handleRequest(requestProps);
  }

  protected async getTracker(req: Request): Promise<string> {
    const body = req.body as Record<string, unknown> | undefined;
    const email = typeof body?.email === "string" ? body.email : "";
    return `${req.ip}:${email}`;
  }
}
