import { Module, Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { randomUUID } from "crypto";
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppExceptionFilter } from './common/filters/app-exception.filter.js';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { DistrictsModule } from './districts/districts.module.js';
import { UsersModule } from './users/users.module.js';
import { HealthModule } from './health/health.module.js';
import { ViewingsModule } from './viewings/viewings.module.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { ListingsModule } from './listings/listings.module.js';
import { FavoritesModule } from './favorites/favorites.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { PublicModule } from './public/public.module.js';
import { MailService } from './mail/mail.service.js';
import { PdfService } from './pdf/pdf.service.js';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard, ThrottlerException } from "@nestjs/throttler";
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { FilesModule } from './files/files.module.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { QueueModule } from "./queue/queue.module.js";
import { RedisModule } from './redis/redis.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { PublicViewingRateLimitService } from './redis/public-viewing-rate-limit.service.js';
import { Redis } from 'ioredis';
import path from 'path';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Injectable()
export class GlobalThrottlerGuard extends ThrottlerGuard {
  @Inject(PublicViewingRateLimitService)
  private readonly publicViewingRateLimitService: PublicViewingRateLimitService;

  protected async handleRequest(
    options: {
      context: ExecutionContext;
      limit: number;
      ttl: number;
      throttler: any;
      blockDuration: number;
    }
  ): Promise<boolean> {
    const { context, limit, ttl, throttler, blockDuration } = options;
    if (throttler.name === 'ws') {
      return true;
    }

    if (context.getType() === 'ws') return true;

    const req = context.switchToHttp().getRequest();
    const url = req.url || '';
    const path = req.path || '';

    if (throttler.name === 'api' && (path === '/public/listings' || path === '/health')) return true;

    if (url.includes('/socket.io')) return true;

    const buildSecret = process.env.NEXT_BUILD_SECRET;
    const buildRequest = req.headers["x-build-request"];

    if (req.method === "GET" && buildSecret && buildRequest === buildSecret) return true;

    if (throttler.name === 'login' || throttler.name === 'register') return true;
    if (throttler.name === 'viewing' && (!url.includes('/viewings') || /^\/public\/listings\/\d+\/viewings$/.test(path))) return true;
    if (throttler.name === 'viewingPublic' && !/^\/public\/listings\/\d+\/viewings$/.test(path)) return true;
    if (throttler.name === 'upload' && !url.includes('/photos') && !url.includes('/avatar')) return true;

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    if (throttler.name === 'viewingPublic') {
      const result = await this.publicViewingRateLimitService.check(ip, limit, ttl);
      if (!result.allowed) throw new ThrottlerException();
      return true;
    }

    const key = `throttler:${throttler.name}:${ip}`;

    const { totalHits } = await this.storageService.increment(
      key,
      ttl,
      limit,
      blockDuration,
      throttler.name
    );

    if (totalHits > limit) throw new ThrottlerException();

    return true;
  }
}

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.resolve('./public'),
      serveRoot: '/static',
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: ["REDIS"],
      useFactory: (redis: Redis) => ({
        throttlers: [
          { name: "api", ttl: 15 * 60_000, limit: 500 },
          { name: "login", ttl: 15 * 60_000, limit: 10 },
          { name: "register", ttl: 60 * 60_000, limit: 5 },
          { name: "upload", ttl: 15 * 60_000, limit: 30 },
          { name: "viewing", ttl: 60 * 60_000, limit: 20 },
          { name: "viewingPublic", ttl: 15 * 60_000, limit: 5 },
          { name: "ws", ttl: 1000, limit: 100 },
        ],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    DistrictsModule,
    UsersModule,
    HealthModule,
    ViewingsModule,
    AuthModule,
    PrismaModule,
    ListingsModule,
    FavoritesModule,
    RealtimeModule,
    FilesModule,
    PublicModule,
    QueueModule,
    TasksModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? "info",
        transport: process.env.NODE_ENV !== "production" ? { target: "pino-pretty", options: { singleLine: true } } : undefined,
        redact: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.passwordHash", "*.refreshToken"],
        autoLogging: true,
        genReqId: (req, res) => {
          const requestId = typeof req.headers["x-request-id"] === "string" ? req.headers["x-request-id"] : randomUUID();
          res.setHeader("x-request-id", requestId);
          return requestId;
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppExceptionFilter,
    AppService,
    PublicViewingRateLimitService,
    { provide: APP_GUARD, useClass: GlobalThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    PrismaService,
    MailService,
    PdfService
  ],
})
export class AppModule { }