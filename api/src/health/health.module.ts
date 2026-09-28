import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';
import { DistrictsModule } from '../districts/districts.module.js';
import { UsersModule } from '../users/users.module.js';
import { TasksModule } from '../tasks/tasks.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
    imports: [TerminusModule, PrismaModule, DistrictsModule, UsersModule, TasksModule],
    controllers: [HealthController],
    providers: [HealthService],
})

export class HealthModule {}