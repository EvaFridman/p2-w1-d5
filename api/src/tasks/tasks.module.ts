import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module.js';
import { ListingsModule } from '../listings/listings.module.js';
import { ViewingsModule } from '../viewings/viewings.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { QueueModule } from '../queue/queue.module.js';
import { RedisModule } from '../redis/redis.module.js';
import { TasksController } from './tasks.controller.js';
import { TaskRunnerService } from './task-runner.service.js';

@Module({
  imports: [
    FilesModule,
    ListingsModule,
    ViewingsModule,
    PrismaModule,
    QueueModule,
    RedisModule,
  ],
  controllers: [TasksController],
  providers: [TaskRunnerService],
  exports: [TaskRunnerService],
})
export class TasksModule {}
