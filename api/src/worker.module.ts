import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module.js';
import { QueueModule } from './queue/queue.module.js';
import { PdfService } from './pdf/pdf.service.js';
import { MailService } from './mail/mail.service.js';
import { MailConsumer } from './queue/consumers/mail.consumer.js';
import { ActivityConsumer } from './queue/consumers/activity.consumer.js';
import { RedisModule } from './redis/redis.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    QueueModule,
    RedisModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.LOGDY !== 'true' && process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          '*.password',
          '*.passwordHash',
          '*.refreshToken',
        ],
        autoLogging: true,
        customProps: () => ({
          process: process.env.LOG_PROCESS ?? 'queue-worker',
        }),
      },
    }),
  ],
  providers: [PdfService, MailService, MailConsumer, ActivityConsumer],
})
export class WorkerModule {}
